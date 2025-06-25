export const getSessionContext = () => {
  try {
    const sessionStr = localStorage.getItem("currentSession");
    console.log(sessionStr)
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
