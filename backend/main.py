"""Smart Talent Engine — FastAPI application with all routes.

Routes:
  POST   /api/jobs                        Create job with title + JD text
  GET    /api/jobs                        List all jobs with summary stats
  GET    /api/jobs/{job_id}               Single job detail
  POST   /api/jobs/{job_id}/resumes/upload  Bulk upload resumes (multipart)
  GET    /api/jobs/{job_id}/resumes/status   Batch processing status
  POST   /api/jobs/{job_id}/rank           Trigger full ranking pipeline
  GET    /api/jobs/{job_id}/ranking         Get ranked candidates list
  GET    /api/jobs/{job_id}/hidden-gems     Get hidden gems only
  GET    /api/candidates/{candidate_id}     Full candidate profile
  GET    /api/candidates/{candidate_id}/score/{job_id}  Scoring result
  POST   /api/candidates/compare            Side-by-side comparison
  GET    /api/jobs/{job_id}/stats            Pool-level insights
"""

import json
import uuid
import time
import asyncio
import os
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import database as db
from models import (
    JobCreate, JobResponse, JobListResponse, BatchStatus,
    ResumeStatusItem, RankingResponse, CompareRequest, CompareResponse,
    StatsResponse, MatchResult, CandidateProfile, SkillNode,
)
from extractor import build_candidate_profile
from alias_matcher import match_skills_in_text
from jd_parser import parse_jd
from matcher import match_candidate_to_requirements, classify_matches
from scorer import (
    score_candidate, build_gap_analysis, extract_behavioural_signals,
    get_confidence_level as scorer_confidence,
)
from hidden_gem import detect_hidden_gem
from explainer import generate_justification, generate_comparison_summary, generate_decision_trace

from vector_store import VectorStore
from llm_extractor import LLMExtractor
from reranker import LLMReranker
from trajectory import compute_trajectory
from classifier import classify
from dotenv import load_dotenv

load_dotenv()
vector_store = VectorStore()
llm_extractor = LLMExtractor()
reranker = LLMReranker()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    yield


app = FastAPI(
    title="Smart Talent Engine",
    description="Graph-driven resume screening API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Jobs ────────────────────────────────────────────────────

@app.post("/api/jobs", response_model=JobResponse)
async def create_job(job: JobCreate):
    job_id = str(uuid.uuid4())
    
    # Parse JD into requirements
    jd_result = parse_jd(job.description)
    requirements_json = json.dumps(jd_result["requirements"])
    
    await db.save_job(job_id, job.title, job.description, requirements_json)
    
    from datetime import datetime
    return JobResponse(
        job_id=job_id,
        title=job.title,
        description=job.description,
        status="created",
        created_at=datetime.utcnow().isoformat(),
    )


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    await db.delete_job(job_id)
    return {"message": "Job deleted"}


@app.get("/api/jobs", response_model=JobListResponse)
async def list_jobs():
    jobs = await db.list_jobs()
    job_list = []
    for j in jobs:
        job_list.append(JobResponse(
            job_id=j["job_id"],
            title=j["title"],
            description=j["description"],
            resume_count=j.get("resume_count", 0),
            status=j.get("status", "created"),
            top_score=j.get("top_score"),
            hidden_gem_count=j.get("hidden_gem_count", 0),
            created_at=j.get("created_at", ""),
        ))
    return JobListResponse(jobs=job_list)


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    j = await db.get_job(job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    return JobResponse(
        job_id=j["job_id"],
        title=j["title"],
        description=j["description"],
        resume_count=j.get("resume_count", 0),
        status=j.get("status", "created"),
        top_score=j.get("top_score"),
        hidden_gem_count=j.get("hidden_gem_count", 0),
        created_at=j.get("created_at", ""),
    )


# ── Resume Upload ───────────────────────────────────────────

@app.post("/api/jobs/{job_id}/resumes/upload")
async def upload_resumes(job_id: str, files: list[UploadFile] = File(...)):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    # Load skill graph for extraction
    with open("skill_graph.json", "r") as f:
        graph = json.load(f)

    results = []
    candidates_for_vector_store = []
    
    for file in files:
        filename = file.filename or "unknown"
        await db.save_batch_item(job_id, filename, "queued")
        
        try:
            # Save file temporarily to disk for Docling/OCR
            temp_path = f"temp_{uuid.uuid4()}_{filename}"
            with open(temp_path, "wb") as f:
                f.write(await file.read())
            
            await db.update_batch_item(job_id, filename, status="parsing")
            
            # Use the new full pipeline from extractor.py
            profile = build_candidate_profile(temp_path, graph)
            
            await db.update_batch_item(job_id, filename, status="extracting_skills")
            
            # Save to database
            await db.save_candidate(
                candidate_id=profile["candidate_id"],
                job_id=job_id,
                name=profile["name"],
                email=profile["email"],
                resume_format=profile["resume_format"],
                filename=filename,
                parse_confidence=profile["parse_confidence"],
                profile_json=json.dumps(profile),
                raw_text=profile["raw_text"],
            )
            
            candidates_for_vector_store.append(profile)
            
            # Update batch status
            await db.update_batch_item(
                job_id, filename,
                status="complete",
                skills_found=len(profile["skill_nodes"]),
                candidate_id=profile["candidate_id"],
            )
            
            results.append({
                "filename": filename,
                "status": "complete",
                "skills_found": len(profile["skill_nodes"]),
                "candidate_id": profile["candidate_id"],
            })
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
        except Exception as e:
            print(f"Upload failed for {filename}: {e}")
            await db.update_batch_item(job_id, filename, status="failed", error=str(e))
            results.append({"filename": filename, "status": "failed", "error": str(e)})
    
    # Batch upsert to vector store
    if candidates_for_vector_store:
        vector_store.upsert_resumes(job_id, candidates_for_vector_store)
        
    await db.update_job(job_id, status="parsed")
    return {"job_id": job_id, "results": results}


@app.get("/api/jobs/{job_id}/resumes/status", response_model=BatchStatus)
async def get_resume_status(job_id: str):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    items = await db.get_batch_status(job_id)
    
    status_items = []
    completed = 0
    failed = 0
    in_progress = 0
    
    for item in items:
        s = item.get("status", "queued")
        if s == "complete":
            completed += 1
        elif s == "failed":
            failed += 1
        elif s in ("parsing", "extracting_skills"):
            in_progress += 1
        
        status_items.append(ResumeStatusItem(
            filename=item["filename"],
            status=s,
            skills_found=item.get("skills_found", 0),
            error=item.get("error"),
            candidate_id=item.get("candidate_id"),
        ))
    
    return BatchStatus(
        job_id=job_id,
        total=len(items),
        completed=completed,
        failed=failed,
        in_progress=in_progress,
        items=status_items,
    )


# ── Ranking ─────────────────────────────────────────────────

@app.post("/api/jobs/{job_id}/rank")
async def rank_candidates(job_id: str):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    requirements = json.loads(job.get("requirements_json", "[]"))
    jd_text = job.get("description", "")
    
    # Step 1: Semantic Retrieval (Stage 1)
    # Get top 30 candidates by similarity
    top_30_ids = vector_store.query_top_candidates(job_id, jd_text, n_results=30)
    
    if not top_30_ids:
        # Fallback to all candidates if vector store empty
        candidates = await db.get_candidates_for_job(job_id)
    else:
        candidates = await db.get_candidates_by_ids(top_30_ids)

    results = []
    
    for cand in candidates:
        profile = json.loads(cand["profile_json"])
        
        # Step 2: LLM Structured Extraction (Stage 2)
        # Optional: Only for candidates with high parse confidence or top 10 similarity
        llm_data = await llm_extractor.extract_structured_skills(cand["raw_text"])
        
        # Step 3: Graph Scoring & Validation (Stage 3)
        # autoritative layer - deterministic
        is_fresher = profile.get("candidate_type", {}).get("type") == "fresher"
        
        score, enriched_reqs = score_candidate(
            per_requirement_results=match_candidate_to_requirements(profile["skill_node_ids"], requirements),
            candidate_skill_nodes=profile["skill_nodes"],
            most_recent_year=profile.get("most_recent_year"),
            is_fresher=is_fresher,
            project_text=profile.get("sections", {}).get("projects", "")
        )
        
        matches_classified = classify_matches(enriched_reqs)
        direct_matches = matches_classified["direct_matches"]
        inferred_matches = matches_classified["inferred_matches"]
        gaps = matches_classified["gaps"]
        
        hidden_gem_flag, hidden_gem_type, hidden_gem_explanation = detect_hidden_gem(
            score, direct_matches, inferred_matches, gaps, profile["skill_nodes"], enriched_reqs
        )
        
        confidence_level = scorer_confidence(profile.get("parse_confidence", 1.0))

        # Build base result
        match_result = {
            "candidate_id": cand["candidate_id"],
            "name": cand["name"],
            "compatibility_score": score,
            "confidence_level": confidence_level,
            "direct_matches": direct_matches,
            "inferred_matches": inferred_matches,
            "gaps": gaps,
            "per_requirement": enriched_reqs,
            "hiring_profile": profile.get("candidate_type", {}),
            "skill_nodes": profile["skill_nodes"],
            "hidden_gem_flag": hidden_gem_flag,
            "hidden_gem_type": hidden_gem_type,
            "hidden_gem_explanation": hidden_gem_explanation,
            "keyword_stuffing_flag": profile.get("keyword_stuffing_flag", False),
            "retrieval_method": "rag_retrieved",
            "justification": generate_justification(
                cand["name"], score, direct_matches, inferred_matches, gaps, 
                hidden_gem_flag, hidden_gem_type, hidden_gem_explanation, [], {}
            ),
            "decision_trace": "", # To be filled after re-ranking
            "llm_reasoning": llm_data.get("brief_summary", ""),
            "llm_extraction": llm_data.get("skills", [])
        }
        results.append(match_result)

    # Sort by graph score
    results.sort(key=lambda x: x["compatibility_score"], reverse=True)
    
    # Step 4: LLM Re-ranking (Stage 4)
    # Only for top 10
    top_10 = results[:10]
    reranked_top_10 = await reranker.rerank(jd_text, top_10)
    
    # Merge back and save
    final_results = reranked_top_10 + results[10:]
    
    for rank, res in enumerate(final_results):
        # Generate final decision trace
        res["decision_trace"] = generate_decision_trace(
            candidate_name=res["name"],
            score=res["compatibility_score"],
            per_requirement=res["per_requirement"],
            trajectory={}, # Placeholder
            hiring_profile=res["hiring_profile"],
            llm_reranked=res.get("llm_rank") is not None
        )
        
        await db.save_match_result(res["candidate_id"], job_id, res["compatibility_score"], json.dumps(res))

    await db.update_job(job_id, status="ranked", top_score=final_results[0]["compatibility_score"] if final_results else 0)
    
    return {"job_id": job_id, "results": final_results}


@app.get("/api/jobs/{job_id}/ranking")
async def get_ranking(job_id: str):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    rankings = await db.get_rankings_for_job(job_id)
    results = []
    for r in rankings:
        data = json.loads(r["result_json"])
        results.append(data)
    
    return {
        "job_id": job_id,
        "total_candidates": len(results),
        "results": results,
    }


@app.get("/api/jobs/{job_id}/hidden-gems")
async def get_hidden_gems(job_id: str):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    gems = await db.get_hidden_gems_for_job(job_id)
    results = []
    for g in gems:
        data = json.loads(g["result_json"])
        results.append(data)
    
    return {
        "job_id": job_id,
        "hidden_gems": results,
    }


# ── Candidates ──────────────────────────────────────────────

@app.get("/api/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    cand = await db.get_candidate(candidate_id)
    if not cand:
        raise HTTPException(404, "Candidate not found")
    
    profile = json.loads(cand["profile_json"])
    return profile


@app.get("/api/candidates/{candidate_id}/score/{job_id}")
async def get_candidate_score(candidate_id: str, job_id: str):
    result = await db.get_match_result(candidate_id, job_id)
    if not result:
        raise HTTPException(404, "Score not found. Run ranking first.")
    
    return json.loads(result["result_json"])


# ── Comparison ──────────────────────────────────────────────

@app.post("/api/candidates/compare")
async def compare_candidates(request: CompareRequest):
    if len(request.candidate_ids) < 2 or len(request.candidate_ids) > 3:
        raise HTTPException(400, "Compare requires 2-3 candidate IDs")
    
    candidates = []
    per_req_data = []
    
    for cid in request.candidate_ids:
        result = await db.get_match_result(cid, request.job_id)
        if not result:
            raise HTTPException(404, f"Score not found for candidate {cid}")
        
        data = json.loads(result["result_json"])
        candidates.append(data)
        per_req_data.append(data.get("per_requirement", []))
    
    # Find biggest differentiator
    differentiator = None
    max_diff = 0
    if per_req_data and len(per_req_data) >= 2:
        for j in range(len(per_req_data[0])):
            scores_at_j = []
            for i in range(len(per_req_data)):
                if j < len(per_req_data[i]):
                    scores_at_j.append(per_req_data[i][j].get("weighted_score", 0))
            if len(scores_at_j) >= 2:
                diff = max(scores_at_j) - min(scores_at_j)
                if diff > max_diff:
                    max_diff = diff
                    differentiator = {
                        "requirement": per_req_data[0][j].get("requirement_label", ""),
                        "scores": {
                            candidates[k]["name"]: scores_at_j[k] if k < len(scores_at_j) else 0
                            for k in range(len(candidates))
                        },
                    }
    
    summary = generate_comparison_summary(candidates, per_req_data)
    
    return CompareResponse(
        job_id=request.job_id,
        candidates=[MatchResult(**c) for c in candidates],
        differentiator=differentiator,
        summary=summary,
    )


# ── Stats ───────────────────────────────────────────────────

@app.get("/api/jobs/{job_id}/stats")
async def get_job_stats(job_id: str):
    job = await db.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    candidates = await db.get_candidates_for_job(job_id)
    rankings = await db.get_rankings_for_job(job_id)
    
    # Compute pool-level stats
    total_skills = 0
    skill_frequency = {}
    for c in candidates:
        profile = json.loads(c["profile_json"])
        for sn in profile.get("skill_nodes", []):
            nid = sn["node_id"]
            skill_frequency[nid] = skill_frequency.get(nid, 0) + 1
            total_skills += 1
    
    # Top skills in pool
    top_skills = sorted(skill_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Score distribution
    scores = [json.loads(r["result_json"]).get("compatibility_score", 0) for r in rankings]
    
    return {
        "job_id": job_id,
        "total_candidates": len(candidates),
        "total_ranked": len(rankings),
        "top_skills": [{"node_id": k, "count": v} for k, v in top_skills],
        "score_distribution": {
            "min": min(scores) if scores else 0,
            "max": max(scores) if scores else 0,
            "avg": sum(scores) / len(scores) if scores else 0,
            "median": sorted(scores)[len(scores)//2] if scores else 0,
        },
        "avg_skills_per_candidate": round(total_skills / len(candidates), 1) if candidates else 0,
    }


@app.get("/api/stats", response_model=StatsResponse)
async def get_global_stats():
    stats = await db.get_global_stats()
    return StatsResponse(**stats)
