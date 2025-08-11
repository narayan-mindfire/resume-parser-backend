from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/test")
async def test(request: Request):
    request_data = await request.json()
    print(request_data)
    return JSONResponse(status_code=200, content={
        "message": "working"
    })