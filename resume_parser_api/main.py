from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from services import test

app = FastAPI()
app.include_router(test.router)

@app.post("/")
async def main(request: Request): 
    return JSONResponse(status_code=200, content={
        "name": "narayan"
    })

