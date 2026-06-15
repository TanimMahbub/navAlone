document.addEventListener("DOMContentLoaded", () => {
    const menu = document.querySelector(".mm");

    const updateMenuHeight = (activeMenu) => {
        const height = activeMenu.scrollHeight;
        menu.style.setProperty("--mmHeight", `${height}px`);
    };

    const setActiveMenu = (newActiveMenu) => {
        const currentActiveMenu = menu.querySelector(".active-menu");
        if (currentActiveMenu) {
            currentActiveMenu.classList.remove("active-menu");
        }
        newActiveMenu.classList.add("active-menu");
        requestAnimationFrame(() => updateMenuHeight(newActiveMenu));
    };

    // Set the initial menu to its correct height with transitions suppressed,
    // so the container does not animate from height 0 on first paint.
    const initialMenu = document.querySelector(".menu-level");
    menu.classList.add("no-transition");
    initialMenu.classList.add("active-menu");

    const settleInitialHeight = () => {
        updateMenuHeight(initialMenu);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => menu.classList.remove("no-transition"));
        });
    };

    // Wait for web fonts so scrollHeight is measured against the final layout.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(settleInitialHeight);
    } else {
        settleInitialHeight();
    }

    menu.addEventListener("click", (e) => {
        if (e.target.classList.contains("menu-item")) {
            const targetMenu = document.getElementById(e.target.dataset.target);
            const parentMenu = e.target.closest(".menu-level");

            if (targetMenu && parentMenu) {
                targetMenu.style.transform = "translateX(0)";
                parentMenu.style.transform = "translateX(-100%)";

                const title = e.target.textContent.replace(" →", "");
                const header = targetMenu.querySelector(".menu-header .menu-title");
                if (header) {
                    header.textContent = title;
                }
                targetMenu.dataset.previous = parentMenu.id;
                setActiveMenu(targetMenu);
            }
        }

        if (e.target.classList.contains("back-button")) {
            const currentMenu = e.target.closest(".menu-level");
            const previousMenuId = currentMenu.dataset.previous;
            const previousMenu = document.getElementById(previousMenuId);

            if (currentMenu && previousMenu) {
                currentMenu.style.transform = "translateX(100%)";
                previousMenu.style.transform = "translateX(0)";
                setActiveMenu(previousMenu);
            }
        }
    });
});
