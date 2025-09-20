// Ganti dengan kredensial API Anda
const token = process.env.WA_TOKEN;
const secret_key = process.env.WA_SECRET;

export async function sendMessage(phone: string, message: string) {
  try {
    const url = `https://tegal.wablas.com/api/send-message?token=${token}.${secret_key}&phone=${phone}&message=${encodeURIComponent(
      message
    )}`;
    const response = await fetch(url, {
      method: "GET", // sesuai request aslinya
    });

    console.log("WABLAS SUKSES");
    console.log(response);

    if (!response.ok) {
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`
      );
    }

    // const result = await response.json();
    // console.log(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
