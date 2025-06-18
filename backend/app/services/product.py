from fastapi import HTTPException
from PyPDF2 import PdfReader
from datetime import datetime
from bson import ObjectId
from ..database import db
from typing import Optional


product_collection = db["products"]


def read_pdf(pdf_file):
    reader = PdfReader(pdf_file)
    text = ""
    
    metadata = {
        'title': reader.metadata.get('/Title', 'Untitled'),
        'author': reader.metadata.get('/Author', 'Unknown'),
        'creation_date': reader.metadata.get('/CreationDate', ''),
        'total_pages': len(reader.pages)
    }
    
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    return text.strip(), metadata

def create_product_process(name: str, category_id: ObjectId, pdf_content: str, metadata: dict,token, description: Optional[str] = None):
    if product_collection.find_one({"name":name}):
        raise HTTPException(status_code=409, detail= "Product with same name exist")
    product = {
        "name": name,
        "category_id": ObjectId(category_id),
        "content": pdf_content,
        "metadata": metadata,
        "description": description,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "created_by": token["id"],
        "updated_by": token["id"],
        "is_deleted": False,
    }
    result = product_collection.insert_one(product)
    return True

def list_products_category_wise(category_id):
    data = product_collection.find({"category_id": ObjectId(category_id),"is_deleted": False})
    return data

def get_product(product_id):
    return product_collection.find_one({"_id":ObjectId(product_id)})