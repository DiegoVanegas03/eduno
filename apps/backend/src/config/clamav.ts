import NodeClam from "clamscan";

let clamscanInstance: NodeClam;

export const initClamAv = async (): Promise<NodeClam | undefined> => {
  try {
    clamscanInstance = await new NodeClam().init({
      clamdscan: {
        host: process.env.CLAMAV_HOST || "localhost",
        port: parseInt(process.env.CLAMAV_PORT || "3310", 10),
        timeout: 60000,
        local_fallback: false,
        active: true,
      },
      preference: "clamdscan",
    });
    console.log("✅ ClamAV conectado correctamente");
    return clamscanInstance;
  } catch (err) {
    console.error("❌ Error conectando a ClamAV:", err);
  }
};

export const getClamScanner = () => clamscanInstance;
