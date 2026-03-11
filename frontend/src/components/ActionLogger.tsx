import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ActionLogger = () => {
    const location = useLocation();

    // Log Route Changes
    useEffect(() => {
        console.log(`%c📍 Navigation to: ${location.pathname}${location.search}`, "color: #3b82f6; font-weight: bold;");
    }, [location]);

    // Log Global Events
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Try to find a meaningful label
            let label = "";
            if (target.getAttribute("aria-label")) label = target.getAttribute("aria-label")!;
            else if (target.innerText && target.innerText.length < 30) label = target.innerText;
            else if (target.id) label = `#${target.id}`;
            else if (target.getAttribute("name")) label = target.getAttribute("name")!;
            else label = target.tagName.toLowerCase();

            // Find closest button/link if not directly clicked
            const closestInteractive = target.closest("button, a, input, select");
            const elementInfo = closestInteractive ? `(inside ${closestInteractive.tagName.toLowerCase()})` : "";

            console.log(`%c🖱️ Click detected on: "${label}" ${elementInfo}`, "color: #10b981;", target);
        };

        const handleInput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const type = target.type;

            // Avoid logging passwords
            if (type === "password") {
                console.log(`%c📝 Input change on: <password field>`, "color: #f59e0b;");
            } else {
                const val = target.value.length > 20 ? target.value.substring(0, 20) + "..." : target.value;
                console.log(`%c📝 Input change: "${val}" (in ${target.name || target.id || target.tagName})`, "color: #f59e0b;");
            }
        };

        // Use capture phase (true) to ensure we catch events before propagation stops
        window.addEventListener("click", handleClick, true);
        window.addEventListener("change", handleInput, true); // Change for inputs

        return () => {
            window.removeEventListener("click", handleClick, true);
            window.removeEventListener("change", handleInput, true);
        };
    }, []);

    return null;
};
