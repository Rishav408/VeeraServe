from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserPreferences(BaseModel):
    veg: bool | None = None
    spice_level: int | None = Field(default=None, ge=0, le=4)
    allergies: list[str] = Field(default_factory=list)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    preferences: UserPreferences | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
