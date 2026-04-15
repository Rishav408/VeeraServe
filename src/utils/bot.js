export async function getBotResponse(input) {
  try {
    const formData = new FormData();
    formData.append("text", input);
    formData.append("session_id", "my_user_session");

    const res = await fetch("http://localhost:8000/api/v1/chat", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
        throw new Error("Backend error");
    }

    const data = await res.json();
    return { message: data.response, action: null };
  } catch (error) {
    return { message: "Oops, something went wrong with the AI connection! Make sure the backend is running.", action: null };
  }
}
