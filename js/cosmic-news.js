const newsFeaturedContainer = document.querySelector("[data-news-featured]");
const newsLatestVideoContainer = document.querySelector("[data-news-latest-video]");
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
        tag: "Cosmic News",
        title: "Latest news from Saturn Aerospace",
        meta: "Official updates, mission notes, fleet news, and community announcements.",
        body: "This page is where Saturn Aerospace publishes its latest stories and major updates as new missions, vehicles, and milestones arrive.",
        note: "New SaturnCast videos will appear below as they are published.",
        image: ""
    },
    posts: []
};

const cloneNewsData = (data) => JSON.parse(JSON.stringify(data));

const defaultSaturnCastVideo = {
    tag: "SaturnCast",
    title: "SaturnCast: Part One",
    meta: "Monthly video update from Saturn Aerospace.",
    body: "This video covers the Leadership transition, Hyperion/Tarvos incident, the Rhea return to flight, a strategic shift in the lunar missions, and the SCOM program restart and a Q&A at the end.",
    videoUrl: "https://youtu.be/k9M--UIoIUs",
    author: "Saturn Aerospace",
    updatedAt: "2026-04-15T00:00:00.000Z"
};

const getYouTubeEmbedUrl = (value) => {
    const raw = String(value || "").trim();

    if (!raw) {
        return "";
    }

    try {
        const url = new URL(raw);

        if (url.hostname === "youtu.be") {
            const videoId = url.pathname.replaceAll("/", "").trim();
            return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
        }

        if (url.hostname.includes("youtube.com")) {
            const videoId = url.searchParams.get("v");

            if (videoId) {
                return `https://www.youtube-nocookie.com/embed/${videoId}`;
            }

            if (url.pathname.startsWith("/embed/")) {
                return `https://www.youtube-nocookie.com${url.pathname}`;
            }
        }
    } catch {
        return "";
    }

    return "";
};

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

    const id = String(post.id || `post-${index}`).trim();
    const tag = String(post.tag || "").trim();
    const title = String(post.title || "").trim();
    const meta = String(post.meta || "").trim();
    const body = String(post.body || "").trim();
    const image = String(post.image || "").trim();
    const videoUrl = String(post.videoUrl || "").trim();
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
        videoUrl,
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

const normalizeCosmicNews = (data) => {
    const source = data && typeof data === "object" ? data : {};

    return {
        featured: normalizeFeatured(source.featured),
        posts: Array.isArray(source.posts)
            ? source.posts.map(normalizePost).filter(Boolean)
            : []
    };
};

const readLocalImageInput = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Image upload failed"));
        reader.readAsDataURL(file);
    });
};

const readImageInput = async (fileInput, fallbackImage = "") => {
    const file = fileInput?.files?.[0];

    if (!file) {
        return fallbackImage;
    }

    if (window.GitHubSync?.uploadNewsImage) {
        return window.GitHubSync.uploadNewsImage(file);
    }

    return readLocalImageInput(file);
};

const getStoredCosmicNews = () => {
    const raw = localStorage.getItem(cosmicNewsStorageKey);

    if (!raw) {
        return normalizeCosmicNews(defaultCosmicNews);
    }

    try {
        return normalizeCosmicNews(JSON.parse(raw));
    } catch {
        return normalizeCosmicNews(defaultCosmicNews);
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
                    <a class="button button-primary" href="#latest-updates">Watch Latest Video</a>
                </div>
            </div>
            <div class="forum-note">
                <p>${escapeHtml(featured.note)}</p>
            </div>
        </div>
    `;
};

const renderLatestVideo = () => {
    if (!newsLatestVideoContainer) {
        return;
    }

    const latestVideoPost = cosmicNewsState.posts.find((post) => post.videoUrl) || defaultSaturnCastVideo;

    const byline = latestVideoPost.updatedAt
        ? `Posted by ${escapeHtml(latestVideoPost.author)} | ${escapeHtml(formatTimestamp(latestVideoPost.updatedAt))}`
        : `Posted by ${escapeHtml(latestVideoPost.author)}`;
    const videoEmbedUrl = getYouTubeEmbedUrl(latestVideoPost.videoUrl);
    const videoBody = defaultSaturnCastVideo.body;

    newsLatestVideoContainer.innerHTML = `
        <div class="forum-feature-grid forum-feature-grid-video">
            <div>
                ${latestVideoPost.image ? `<img class="forum-image" src="${escapeHtml(latestVideoPost.image)}" alt="${escapeHtml(latestVideoPost.title)}">` : ""}
                ${videoEmbedUrl ? `
                    <div class="forum-video-wrap">
                        <iframe
                            class="forum-video"
                            src="${escapeHtml(videoEmbedUrl)}"
                            title="${escapeHtml(latestVideoPost.title)}"
                            loading="lazy"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen
                        ></iframe>
                    </div>
                    <div class="hero-actions compact-actions">
                        <a class="button button-primary" href="${escapeHtml(latestVideoPost.videoUrl)}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
                    </div>
                ` : `
                    <p class="forum-meta">
                        <a href="${escapeHtml(latestVideoPost.videoUrl)}" target="_blank" rel="noopener noreferrer">Watch the video</a>
                    </p>
                `}
                <span class="forum-tag">${escapeHtml(latestVideoPost.tag)}</span>
                <h3>${escapeHtml(latestVideoPost.title)}</h3>
                <p class="forum-meta">${escapeHtml(latestVideoPost.meta)}</p>
                <p>${escapeHtml(videoBody)}</p>
                <p class="forum-byline">${byline}</p>
            </div>
            <div class="forum-note">
                <p>The latest SaturnCast video is embedded here for quick viewing. New monthly videos can replace this entry as they are published.</p>
            </div>
        </div>
    `;

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
    postForm.elements.videoUrl.value = post.videoUrl || "";
    postForm.scrollIntoView({ behavior: "smooth", block: "center" });
};

const persistCosmicNews = async (employeeName, successMessage, localOnlyMessage) => {
    const normalizedState = normalizeCosmicNews(cosmicNewsState);

    if (window.GitHubSync?.isConfigured()) {
        try {
            cosmicNewsState = normalizeCosmicNews(await window.GitHubSync.saveNews(normalizedState, employeeName));
            saveCosmicNews();
            renderFeaturedStory();
            renderLatestVideo();
            setNewsMessage(successMessage, "is-success");
            return true;
        } catch {
            cosmicNewsState = normalizedState;
            saveCosmicNews();
            renderFeaturedStory();
            renderLatestVideo();
            setNewsMessage(localOnlyMessage, "is-error");
            return false;
        }
    }

    cosmicNewsState = normalizedState;
    saveCosmicNews();
    renderFeaturedStory();
    renderLatestVideo();
    setNewsMessage(localOnlyMessage, "is-error");
    return false;
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
            ? (window.GitHubSync?.isConfigured()
                ? "You can update the featured story, publish posts, upload images, and write those changes back to GitHub from this page."
                : "You can edit from this page, but changes will stay in this browser until GitHub sync is configured in js/github-sync-config.js.")
            : "";
    }

    fillFeaturedForm();
    renderLatestVideo();
};

if (featuredForm) {
    featuredForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const employee = window.EmployeeAuth?.getCurrentEmployee();

        if (!employee) {
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

        const savedToGitHub = await persistCosmicNews(
            employee.displayName,
            "Featured story updated.",
            "Featured story saved only in this browser. Add your GitHub token in js/github-sync-config.js to publish from the website."
        );

        await window.EmployeeAudit?.log("featured_story_updated", {
            page: "cosmic-news",
            title: cosmicNewsState.featured.title,
            sync: savedToGitHub ? "github" : "local"
        });

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
                videoUrl: postForm.elements.videoUrl.value,
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
        } else {
            cosmicNewsState.posts.unshift(nextPost);
        }

        const savedToGitHub = await persistCosmicNews(
            employee.displayName,
            existingIndex >= 0 ? "Post updated." : "New post published.",
            existingIndex >= 0
                ? "Post updated only in this browser. Add your GitHub token in js/github-sync-config.js to publish from the website."
                : "New post saved only in this browser. Add your GitHub token in js/github-sync-config.js to publish from the website."
        );

        await window.EmployeeAudit?.log(existingIndex >= 0 ? "news_post_updated" : "news_post_created", {
            page: "cosmic-news",
            title: nextPost.title,
            sync: savedToGitHub ? "github" : "local"
        });

        resetPostForm();
    });
}

if (postResetButton) {
    postResetButton.addEventListener("click", () => {
        resetPostForm();
        setNewsMessage("", "");
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

const loadCosmicNews = async () => {
    cosmicNewsState = getStoredCosmicNews();
    renderFeaturedStory();
    syncNewsEditor();

    if (!window.GitHubSync?.fetchNews) {
        return;
    }

    try {
        const fetchedNews = await window.GitHubSync.fetchNews(defaultCosmicNews);
        cosmicNewsState = normalizeCosmicNews(fetchedNews);
        saveCosmicNews();
        renderFeaturedStory();
        syncNewsEditor();
    } catch {
        // Keep the local fallback if the public fetch fails.
    }
};

void loadCosmicNews();
