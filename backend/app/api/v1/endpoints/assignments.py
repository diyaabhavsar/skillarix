from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from ....database import db
from ....services.auth import verify_bearer_token
from pydantic import BaseModel, Field

router = APIRouter()

# Collections
assignments_collection = db["assignments"]
users_collection = db["users"]
products_collection = db["products"]
conversations_collection = db["conversations"]

# Models
class AssignmentCreate(BaseModel):
    salesperson_id: str
    product_id: str
    notes: Optional[str] = None

class AssignmentUpdate(BaseModel):
    status: str # 'accepted', 'rejected', 'completed'
    rejection_reason: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: str
    salesperson_name: str
    admin_name: str
    product_name: str
    product_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    conversation_id: Optional[str] = None
    score: Optional[float] = None
    salesperson_id: Optional[str] = None
    category_id: Optional[str] = None


@router.post("", response_model=AssignmentResponse)
async def create_assignment(
    assignment: AssignmentCreate,
    token=Depends(verify_bearer_token)
):
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign tests")
        
    try:
        sp_id = ObjectId(assignment.salesperson_id)
        prod_id = ObjectId(assignment.product_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # Verify salesperson
    salesperson = users_collection.find_one({"_id": sp_id})
    if not salesperson:
        raise HTTPException(status_code=404, detail="Salesperson not found")
        
    # Verify product
    product = products_collection.find_one({"_id": prod_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    new_assignment = {
        "salesperson_id": sp_id,
        "admin_id": ObjectId(token["id"]),
        "product_id": prod_id,
        "status": "pending",
        "notes": assignment.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "conversation_id": None,
        "score": None
    }
    
    result = assignments_collection.insert_one(new_assignment)
    
    return AssignmentResponse(
        id=str(result.inserted_id),
        salesperson_name=salesperson.get("name", salesperson.get("username", "Unknown")),
        admin_name=token.get("name", token.get("username", "Admin")), # Might be missing from token payload
        product_name=product.get("name", "Unknown"),
        product_id=str(prod_id),
        status="pending",
        created_at=new_assignment["created_at"],
        updated_at=new_assignment["updated_at"],
        notes=assignment.notes,
        salesperson_id=str(sp_id),
        conversation_id=None,
        score=None
    )

@router.get("", response_model=List[AssignmentResponse])
async def get_assignments(
    status: Optional[str] = Query(None),
    token=Depends(verify_bearer_token)
):
    query = {}
    
    # If not admin, only show own assignments
    if token["role"] != "admin":
        query["salesperson_id"] = ObjectId(token["id"])
        
    if status:
        query["status"] = status
        
    cursor = assignments_collection.find(query).sort("created_at", -1)
    
    results = []
    
    # Pre-fetch helper (naive implementation for MVP)
    def clean_obj_id(oid):
        return str(oid) if isinstance(oid, ObjectId) else str(oid)

    for doc in cursor:
        sp = users_collection.find_one({"_id": doc["salesperson_id"]})
        adm_id = doc.get("admin_id")
        adm = users_collection.find_one({"_id": adm_id}) if adm_id else None
        prod = products_collection.find_one({"_id": doc["product_id"]})
        
        results.append(AssignmentResponse(
            id=clean_obj_id(doc["_id"]),
            salesperson_name=sp.get("name", sp.get("username", "Unknown")) if sp else "Unknown",
            admin_name=adm.get("name", adm.get("username", "Admin")) if adm else "Admin",
            product_name=prod.get("name", "Unknown") if prod else "Unknown",
            product_id=clean_obj_id(doc["product_id"]),
            category_id=clean_obj_id(prod.get("category_id")) if prod else None,
            status=doc["status"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            notes=doc.get("notes"),
            rejection_reason=doc.get("rejection_reason"),
            conversation_id=clean_obj_id(doc["conversation_id"]) if doc.get("conversation_id") else None,
            score=doc.get("score"),
            salesperson_id=clean_obj_id(doc["salesperson_id"])
        ))
        
    return results

@router.put("/{assignment_id}/respond")
async def respond_assignment(
    assignment_id: str,
    update: AssignmentUpdate,
    token=Depends(verify_bearer_token)
):
    try:
        a_id = ObjectId(assignment_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    assignment = assignments_collection.find_one({"_id": a_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    # Check permissions
    if token["role"] != "admin":
        # Salesperson checks
        if str(assignment["salesperson_id"]) != token["id"]:
            raise HTTPException(status_code=403, detail="Not your assignment")
            
        # Can only modify pending assignments
        if assignment["status"] != "pending":
            # Allow admin to change completed? usually not.
            raise HTTPException(status_code=400, detail=f"Assignment already {assignment['status']}")
            
        if update.status not in ["accepted", "rejected"]:
             raise HTTPException(status_code=400, detail="Invalid status")

    update_data = {
        "status": update.status,
        "updated_at": datetime.utcnow()
    }
    
    if update.status == "rejected":
        update_data["rejection_reason"] = update.rejection_reason
        
    assignments_collection.update_one(
        {"_id": a_id},
        {"$set": update_data}
    )
    
    return {"message": f"Assignment {update.status}"}
