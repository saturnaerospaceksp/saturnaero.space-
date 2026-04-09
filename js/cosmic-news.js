const newsFeaturedContainer = document.querySelector("[data-news-featured]");
const newsPostsContainer = document.querySelector("[data-news-posts]");
const newsTools = document.querySelector("[data-news-tools]");
const newsEditor = document.querySelector("[data-news-editor]");
const newsStatus = document.querySelector("[data-news-status]");
const newsAdminTitle = document.querySelector("[data-news-admin-title]");
const newsMessage = document.querySelector("[data-news-message]");
const newsLogoutButton = document.querySelector("[data-news-logout]");
const featuredForm = document.querySelector("[data-featured-form]");
const postForm = document.querySelector("[data-post-form]");
const postResetButton = document.querySelector("[data-post-reset]");

const cosmicNewsStorageKey = "saturnCosmicNewsData";

const defaultCosmicNews = {
    featured: {
        tag: "Featured Update",
        title: "Use this lead slot for the biggest Saturn Aerospace story of the moment.",
        meta: "Ideal for launch results, fleet reveals, long mission recaps, or a major studio-wide announcement.",
        body: "This featured block is designed to hold the main headline and a longer summary before the reader drops into the rest of the page. If something important happens, this is where it should land first.",
        note: "Suggested use: publish the most important update here, then refresh this lead slot whenever a bigger story takes over.",
        image: ""
    },
    posts: [
        {
            id: "default-mission-update",
            tag: "Mission Update",
            title: "Post launch-day status, mission recaps, or operational notes here.",
            meta: "Best for short updates that still deserve a proper headline and summary.",
            body: "This slot works well for countdown notes, in-flight progress, recovery confirmation, or a short breakdown of what changed during a mission campaign.",
            image: "",
            author: "Saturn Aerospace",
            updatedAt: "Template"
        },
        {
            id: "default-fleet-news",
            tag: "Fleet News",
            title: "Use this space for vehicle reveals, upgrades, and development milestones.",
            meta: "Perfect for Rhea, Daphnis, Hyperion, and future fleet updates.",
            body: "If a vehicle receives a redesign, a new patch, fresh renders, or a major capability change, this card format gives it enough room without needing a full pinned story.",
            image: "",
            author: "Saturn Aerospace",
            updatedAt: "Template"
        },
        {
            id: "default-community-notice",
            tag: "Community Notice",
            title: "Share studio announcements, events, or community-facing news articles.",
            meta: "Useful for schedules, volunteer notices, creative showcases, and public updates.",
            body: "This is the most flexible slot on the page. It can handle general announcements just as easily as editorial-style posts, event summaries, or smaller bits of weekly news.",
            image: "",
            author: "Saturn Aerospace",
            updatedAt: "Template"
        }
    ]
};

const cloneNewsData = (data) => JSON.parse(JSON.stringify(data));

const escapeHtml = (value) => {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
};

const formatTimestamp = (value) => {
    if (!value || value === "Template") {
        return value || "";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
};

const normalizePost = (post, index) => {
    if (!post || typeof post !== "object") {
        return null;
    }

    const id = String(post.id || `post-${index}`);
    const tag = String(post.tag || "").trim();
    const title = String(post.title || "").trim();
    const meta = String(post.meta || "").trim();
    const body = String(post.body || "").trim();
    const image = String(post.image || "").trim();
    const author = String(post.author || "Saturn Aerospace").trim();
    const updatedAt = String(post.updatedAt || "").trim();

    if (!tag || !title || !meta || !body) {
        return null;
    }

    return {
        id,
        tag,
        title,
        meta,
        body,
        image,
        author: author || "Saturn Aerospace",
        updatedAt: updatedAt || "Template"
    };
};

const normalizeFeatured = (featured) => {
    const source = featured && typeof featured === "object" ? featured : {};

    return {
        tag: String(source.tag || defaultCosmicNews.featured.tag).trim() || defaultCosmicNews.featured.tag,
        title: String(source.title || defaultCosmicNews.featured.title).trim() || defaultCosmicNews.featured.title,
        meta: String(source.meta || defaultCosmicNews.featured.meta).trim() || defaultCosmicNews.featured.meta,
        body: String(source.body || defaultCosmicNews.featured.body).trim() || defaultCosmicNews.featured.body,
        note: String(source.note || defaultCosmicNews.featured.note).trim() || defaultCosmicNews.featured.note,
        image: String(source.image || "").trim()
    };
};

const readImageInput = (fileInput, fallbackImage = "") => {
    const file = fileInput?.files?.[0];

    if (!file) {
        return Promise.resolve(fallbackImage);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || fallbackImage));
        reader.onerror = () => reject(new Error("Image upload failed"));
        reader.readAsDataURL(file);
    });
};

const getStoredCosmicNews = () => {
    const raw = localStorage.getItem(cosmicNewsStorageKey);

    if (!raw) {
        return cloneNewsData(defaultCosmicNews);
    }

    try {
        const parsed = JSON.parse(raw);
        const posts = Array.isArray(parsed.posts)
            ? parsed.posts.map(normalizePost).filter(Boolean)
            : cloneNewsData(defaultCosmicNews).posts;

        return {
            featured: normalizeFeatured(parsed.featured),
            posts: posts.length ? posts : cloneNewsData(defaultCosmicNews).posts
        };
    } catch {
        return cloneNewsData(defaultCosmicNews);
    }
};

let cosmicNewsState = getStoredCosmicNews();

const saveCosmicNews = () => {
    localStorage.setItem(cosmicNewsStorageKey, JSON.stringify(cosmicNewsState));
};

const setNewsMessage = (text = "", type = "") => {
    if (!newsMessage) {
        return;
    }

    newsMessage.textContent = text;
    newsMessage.className = type ? `editor-message ${type}` : "editor-message";
};

const renderFeaturedStory = () => {
    if (!newsFeaturedContainer) {
        return;
    }

    const featured = cosmicNewsState.featured;

    newsFeaturedContainer.innerHTML = `
        <div class="forum-feature-grid">
            <div>
                ${featured.image ? `<img class="forum-image" src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.title)}">` : ""}
                <span class="forum-tag">${escapeHtml(featured.tag)}</span>
                <h3>${escapeHtml(featured.title)}</h3>
                <p class="forum-meta">${escapeHtml(featured.meta)}</p>
                <p>${escapeHtml(featured.body)}</p>
                <div class="hero-actions compact-actions">
                    <a class="button button-primary" href="#latest-updates">Read Latest Posts</a>
                </div>
            </div>
            <div class="forum-note">
                <p>${escapeHtml(featured.note)}</p>
            </div>
        </div>
    `;
};

const renderNewsPosts = () => {
    if (!newsPostsContainer) {
        return;
    }

    const isAuthenticated = window.EmployeeAuth?.isAuthenticated();

    if (!cosmicNewsState.posts.length) {
        newsPostsContainer.innerHTML = `
            <article class="forum-card">
                <span class="forum-tag">No Posts Yet</span>
                <h3>Cosmic News is ready for the next update.</h3>
                <p class="forum-meta">The feed is empty right now.</p>
                <p>Log in with an employee account to publish the first post for this session.</p>
            </article>
        `;
        return;
    }

    newsPostsContainer.innerHTML = cosmicNewsState.posts.map((post) => {
        const byline = post.updatedAt
            ? `Posted by ${escapeHtml(post.author)} | ${escapeHtml(formatTimestamp(post.updatedAt))}`
            : `Posted by ${escapeHtml(post.author)}`;

        return `
            <article class="forum-card" data-reveal>
                ${post.image ? `<img class="forum-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}">` : ""}
                <span class="forum-tag">${escapeHtml(post.tag)}</span>
                <h3>${escapeHtml(post.title)}</h3>
                <p class="forum-meta">${escapeHtml(post.meta)}</p>
                <p>${escapeHtml(post.body)}</p>
                <p class="forum-byline">${byline}</p>
                ${isAuthenticated ? `
                    <div class="forum-card-actions">
                        <button class="button button-ghost button-small" type="button" data-post-edit="${escapeHtml(post.id)}">Edit</button>
                        <button class="button button-ghost button-small" type="button" data-post-delete="${escapeHtml(post.id)}">Delete</button>
                    </div>
                ` : ""}
            </article>
        `;
    }).join("");

    document.querySelectorAll("[data-reveal]").forEach((item) => item.classList.add("is-visible"));
};

const fillFeaturedForm = () => {
    if (!featuredForm) {
        return;
    }

    featuredForm.elements.tag.value = cosmicNewsState.featured.tag;
    featuredForm.elements.title.value = cosmicNewsState.featured.title;
    featuredForm.elements.meta.value = cosmicNewsState.featured.meta;
    featuredForm.elements.body.value = cosmicNewsState.featured.body;
    featuredForm.elements.note.value = cosmicNewsState.featured.note;
};

const resetPostForm = () => {
    if (!postForm) {
        return;
    }

    postForm.reset();
    postForm.elements.postId.value = "";
};

const fillPostForm = (postId) => {
    if (!postForm) {
        return;
    }

    const post = cosmicNewsState.posts.find((entry) => entry.id === postId);

    if (!post) {
        return;
    }

    postForm.elements.postId.value = post.id;
    postForm.elements.tag.value = post.tag;
    postForm.elements.title.value = post.title;
    postForm.elements.meta.value = post.meta;
    postForm.elements.body.value = post.body;
    postForm.scrollIntoView({ behavior: "smooth", block: "center" });
};

const syncNewsEditor = () => {
    const employee = window.EmployeeAuth?.getCurrentEmployee();
    const isAuthenticated = Boolean(employee);

    if (newsTools) {
        newsTools.hidden = !isAuthenticated;
    }

    if (newsEditor) {
        newsEditor.hidden = !isAuthenticated;
    }

    if (newsLogoutButton) {
        newsLogoutButton.hidden = !isAuthenticated;
    }

    if (newsAdminTitle) {
        newsAdminTitle.textContent = isAuthenticated
            ? `Editing as ${employee.displayName}`
            : "";
    }

    if (newsStatus) {
        newsStatus.textContent = isAuthenticated
            ? "You can update the featured story, edit existing posts, publish new posts, or remove posts from the feed."
            : "";
    }

    fillFeaturedForm();
    renderNewsPosts();
};

if (featuredForm) {
    featuredForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!window.EmployeeAuth?.isAuthenticated()) {
            setNewsMessage("Log in before editing the featured story.", "is-error");
            return;
        }

        try {
            const image = await readImageInput(featuredForm.elements.image, cosmicNewsState.featured.image);

            cosmicNewsState.featured = normalizeFeatured({
                tag: featuredForm.elements.tag.value,
                title: featuredForm.elements.title.value,
                meta: featuredForm.elements.meta.value,
                body: featuredForm.elements.body.value,
                note: featuredForm.elements.note.value,
                image
            });
        } catch {
            setNewsMessage("Featured image could not be read.", "is-error");
            return;
        }

        saveCosmicNews();
        renderFeaturedStory();
        await window.EmployeeAudit?.log("featured_story_updated", {
            page: "cosmic-news",
            title: cosmicNewsState.featured.title
        });
        setNewsMessage("Featured story updated.", "is-success");
        featuredForm.elements.image.value = "";
    });
}

if (postForm) {
    postForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const employee = window.EmployeeAuth?.getCurrentEmployee();

        if (!employee) {
            setNewsMessage("Log in before creating or editing posts.", "is-error");
            return;
        }

        const postId = String(postForm.elements.postId.value || "").trim();
        const existingPost = cosmicNewsState.posts.find((entry) => entry.id === postId);
        let nextPost;

        try {
            const image = await readImageInput(postForm.elements.image, existingPost?.image || "");
            nextPost = normalizePost({
                id: postId || `post-${Date.now()}`,
                tag: postForm.elements.tag.value,
                title: postForm.elements.title.value,
                meta: postForm.elements.meta.value,
                body: postForm.elements.body.value,
                image,
                author: employee.displayName,
                updatedAt: new Date().toISOString()
            }, cosmicNewsState.posts.length);
        } catch {
            setNewsMessage("Post image could not be read.", "is-error");
            return;
        }

        if (!nextPost) {
            setNewsMessage("Fill in all post fields before saving.", "is-error");
            return;
        }

        const existingIndex = cosmicNewsState.posts.findIndex((entry) => entry.id === nextPost.id);

        if (existingIndex >= 0) {
            cosmicNewsState.posts[existingIndex] = nextPost;
            await window.EmployeeAudit?.log("news_post_updated", {
                page: "cosmic-news",
                title: nextPost.title
            });
            setNewsMessage("Post updated.", "is-success");
        } else {
            cosmicNewsState.posts.unshift(nextPost);
            await window.EmployeeAudit?.log("news_post_created", {
                page: "cosmic-news",
                title: nextPost.title
            });
            setNewsMessage("New post published.", "is-success");
        }

        saveCosmicNews();
        resetPostForm();
        renderNewsPosts();
    });
}

if (postResetButton) {
    postResetButton.addEventListener("click", () => {
        resetPostForm();
        setNewsMessage("", "");
    });
}

if (newsPostsContainer) {
    newsPostsContainer.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return;
        }

        const editId = target.dataset.postEdit;
        const deleteId = target.dataset.postDelete;

        if (editId) {
            fillPostForm(editId);
            setNewsMessage("Editing selected post.", "");
            return;
        }

        if (deleteId) {
            const deletedPost = cosmicNewsState.posts.find((entry) => entry.id === deleteId);
            cosmicNewsState.posts = cosmicNewsState.posts.filter((entry) => entry.id !== deleteId);
            saveCosmicNews();
            renderNewsPosts();
            void window.EmployeeAudit?.log("news_post_removed", {
                page: "cosmic-news",
                title: deletedPost?.title || deleteId
            });
            setNewsMessage("Post removed.", "is-success");
        }
    });
}

if (newsLogoutButton) {
    newsLogoutButton.addEventListener("click", () => {
        window.EmployeeAuth?.logout();
        resetPostForm();
        setNewsMessage("Logged out.", "");
        syncNewsEditor();
    });
}

renderFeaturedStory();
syncNewsEditor();
