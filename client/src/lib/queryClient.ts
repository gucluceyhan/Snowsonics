import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Oturum çerezlerinin gönderildiğinden emin olmak için credentials ayarını include olarak belirtin
  const options: RequestInit = {
    method,
    headers: data ? { 
      "Content-Type": "application/json",
      "Accept": "application/json"
    } : {
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Bu çerezlerin gönderilmesini sağlar
  };
  
  console.log(`API Request: ${method} ${url}`, data ? `Data: ${JSON.stringify(data)}` : 'No data');
  
  try {
    const res = await fetch(url, options);

    // Hata durumunu kontrol et
    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      // Tam yanıt içeriğini görmek için
      const errorText = await res.clone().text();
      console.error(`API Error response: ${errorText}`);
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API Request error:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query Request: GET ${queryKey[0]}`);
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    // Hata durumunu kontrol et
    if (!res.ok) {
      console.error(`Query Error: ${res.status} ${res.statusText}`);
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Unauthorized request to ${queryKey[0]}, returning null as configured`);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Değiştirilen veri her zaman bayat kabul edilsin
      gcTime: 5 * 60 * 1000, // 5 dakika (TanStack Query v5'te cacheTime yerine gcTime kullanılıyor)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
