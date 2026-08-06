"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const menuButton =
        document.querySelector(".menu-toggle");
    const navigation =
        document.querySelector(".primary-navigation");
    const navigationLinks =
        navigation?.querySelectorAll("a");
    const yearElement =
        document.querySelector("#current-year");
    if (yearElement) {
        yearElement.textContent =
            new Date().getFullYear().toString();
    }
    /* --------------------------------------------------
       Mobile navigation
    -------------------------------------------------- */
    if (menuButton && navigation) {
        const closeMenu = () => {
            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
            menuButton.setAttribute(
                "aria-label",
                "Open navigation"
            );
            navigation.classList.remove("is-open");
            document.body.classList.remove("menu-open");
        };
        const openMenu = () => {
            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );
            menuButton.setAttribute(
                "aria-label",
                "Close navigation"
            );
            navigation.classList.add("is-open");
            document.body.classList.add("menu-open");
        };
        menuButton.addEventListener("click", () => {
            const isOpen =
                menuButton.getAttribute(
                    "aria-expanded"
                ) === "true";
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        navigationLinks?.forEach((link) => {
            link.addEventListener("click", closeMenu);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 1000) {
                closeMenu();
            }
        });
    }
    /* --------------------------------------------------
       Website-address validation
    -------------------------------------------------- */
    const normaliseWebsiteAddress = (value) => {
        const trimmedValue = value.trim();
        if (!/^https?:\/\//i.test(trimmedValue)) {
            return `https://${trimmedValue}`;
        }

        return trimmedValue;
    };
    const isValidWebsiteAddress = (value) => {
        try {
            const websiteUrl = new URL(
                normaliseWebsiteAddress(value)
            );
            const hostname =
                websiteUrl.hostname.toLowerCase();
            const domainPattern =
                /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;
            return domainPattern.test(hostname);
        } catch {
            return false;
        }
    };
    const getFormspreeErrorMessage = async (response) => {
        if (response.status === 429) {
            return (
                "Too many attempts were made. " +
                "Please wait a moment and try again."
            );
        }
        try {
            const responseData = await response.json();
            if (
                Array.isArray(responseData.errors) &&
                responseData.errors.length > 0
            ) {
                return responseData.errors
                    .map((error) => error.message)
                    .filter(Boolean)
                    .join(" ");
            }
            if (responseData.error) {
                return responseData.error;
            }
        } catch {
            // Use the general message below when no JSON
            // error response is available.
        }
        return (
            "Your message could not be sent. " +
            "Please check the form and try again."
        );
    };
    /* --------------------------------------------------
       Formspree AJAX submission
    -------------------------------------------------- */
    const connectFormspreeForm = ({
        formSelector,
        statusSelector,
        successSelector,
        websiteFieldSelector,
        websiteRequired = false,
    }) => {
        const form =
            document.querySelector(formSelector);
        const statusElement =
            document.querySelector(statusSelector);
        const successElement =
            document.querySelector(successSelector);
        const websiteField =
            websiteFieldSelector
                ? document.querySelector(
                    websiteFieldSelector
                )
                : null;
        if (
            !form ||
            !statusElement ||
            !successElement
        ) {
            return;
        }
        const submitButton =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );
        const originalButtonText =
            submitButton?.tagName === "BUTTON"
                ? submitButton.textContent
                : submitButton?.value;
        websiteField?.addEventListener("input", () => {
            websiteField.setCustomValidity("");
            statusElement.textContent = "";
            statusElement.className = "form-status";
        });
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            statusElement.textContent = "";
            statusElement.className = "form-status";
            if (websiteField) {
                websiteField.setCustomValidity("");
                const websiteValue =
                    websiteField.value.trim();
                const needsValidation =
                    websiteRequired ||
                    websiteValue.length > 0;
                if (
                    needsValidation &&
                    !isValidWebsiteAddress(websiteValue)
                ) {
                    websiteField.setCustomValidity(
                        "Please enter a complete website address, such as examplehotel.co.uk."
                    );
                    websiteField.reportValidity();
                    websiteField.focus();
                    return;
                }
                if (websiteValue) {
                    websiteField.value =
                        normaliseWebsiteAddress(
                            websiteValue
                        );
                }
            }
            if (!form.reportValidity()) {
                return;
            }
            if (submitButton) {
                submitButton.disabled = true;
                if (submitButton.tagName === "BUTTON") {
                    submitButton.textContent =
                        "Sending…";
                } else {
                    submitButton.value =
                        "Sending…";
                }
            }
            statusElement.textContent =
                "Sending your information…";
            try {
                const response = await fetch(
                    form.action,
                    {
                        method: form.method || "POST",
                        body: new FormData(form),
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );
                if (!response.ok) {
                    throw new Error(
                        await getFormspreeErrorMessage(
                            response
                        )
                    );
                }
                form.reset();
                form.hidden = true;
                successElement.hidden = false;
                successElement.setAttribute(
                    "tabindex",
                    "-1"
                );
                successElement.focus();
            } catch (error) {
                statusElement.textContent =
                    error instanceof Error
                        ? error.message
                        : (
                            "Your message could not be sent. " +
                            "Please try again."
                        );
                statusElement.className =
                    "form-status form-status-error";
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    if (
                        submitButton.tagName === "BUTTON"
                    ) {
                        submitButton.textContent =
                            originalButtonText;
                    } else {
                        submitButton.value =
                            originalButtonText;
                    }
                }
            }
        });
    };
    connectFormspreeForm({
        formSelector: "#contact-form",
        statusSelector: "#contact-form-status",
        successSelector: "#contact-form-success",
        websiteFieldSelector: "#contact-website",
        websiteRequired: false,
    });
    connectFormspreeForm({
        formSelector: "#website-review-form",
        statusSelector: "#review-form-status",
        successSelector: "#review-form-success",
        websiteFieldSelector: "#review-website",
        websiteRequired: true,
    });
});