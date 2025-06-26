export const getSessionContext = () => {
  try {
    const sessionStr = localStorage.getItem("currentSession");
    if (!sessionStr) return { productId: "", testConfigId: "" };
    const session = JSON.parse(sessionStr);
    return {
      productId: session.productId || "",
      testConfigId: session.testConfigId || "",
    };
  } catch {
    return { productId: "", testConfigId: "" };
  }
};
