export const getTestConfig = (key) => {
    return (window._env_ && window._env_[key]) || "Variable not found";
};