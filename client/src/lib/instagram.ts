import { apiRequest } from "./queryClient";

export async function importInstagramProfilePicture() {
  try {
    const response = await apiRequest("POST", "/api/user/import-instagram-photo");
    if (!response.ok) {
      throw new Error("Failed to import Instagram profile picture");
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}
