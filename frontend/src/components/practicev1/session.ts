export const getSessionContext = () => {
  try {
    const sessionStr = localStorage.getItem("currentSession");
    if (!sessionStr) return { productId: "", testConfigId: "", assignmentId: "" };
    const session = JSON.parse(sessionStr);
    return {
      productId: session.productId || "",
      testConfigId: session.testConfigId || "",
      assignmentId: session.assignmentId || "",
    };
  } catch {
    return { productId: "", testConfigId: "", assignmentId: "" };
  }
};
