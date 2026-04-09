const GITHUB_SYNC_PLACEHOLDER_TOKENS = new Set([
    "",
    "PASTE_GITHUB_TOKEN_HERE",
    "ghp_your_token_here",
    "github_pat_your_token_here"
]);

const cloneGitHubSyncData = (value) => JSON.parse(JSON.stringify(value));

const normalizeGitHubSyncConfig = (config) => {
    const source = config && typeof config === "object" ? config : {};

    return {
        owner: String(source.owner || "").trim(),
        repo: String(source.repo || "").trim(),
        branch: String(source.branch || "main").trim() || "main",
        token: String(source.token || "").trim(),
        newsPath: String(source.newsPath || "data/cosmic-news.json").trim() || "data/cosmic-news.json",
        auditLogPath: String(source.auditLogPath || "data/audit-log.json").trim() || "data/audit-log.json",
        imageDirectory: String(source.imageDirectory || "img/news").trim() || "img/news"
    };
};

const gitHubSyncConfig = normalizeGitHubSyncConfig(window.GITHUB_SYNC_CONFIG);

const encodeGitHubPath = (path) => {
    return String(path || "")
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");
};

const toBase64Unicode = (value) => {
    const bytes = new TextEncoder().encode(String(value || ""));
    let binary = "";

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary);
};

const fromBase64Unicode = (value) => {
    const binary = atob(String(value || "").replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
};

const isGitHubSyncConfigured = () => {
    return Boolean(
        gitHubSyncConfig.owner &&
        gitHubSyncConfig.repo &&
        gitHubSyncConfig.branch &&
        gitHubSyncConfig.token &&
        !GITHUB_SYNC_PLACEHOLDER_TOKENS.has(gitHubSyncConfig.token)
    );
};

const getGitHubApiHeaders = (includeJson = false) => {
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    };

    if (gitHubSyncConfig.token) {
        headers.Authorization = `Bearer ${gitHubSyncConfig.token}`;
    }

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
};

const getGitHubContentsApiUrl = (path) => {
    return `https://api.github.com/repos/${encodeURIComponent(gitHubSyncConfig.owner)}/${encodeURIComponent(gitHubSyncConfig.repo)}/contents/${encodeGitHubPath(path)}`;
};

const getGitHubRawUrl = (path) => {
    return `https://raw.githubusercontent.com/${encodeURIComponent(gitHubSyncConfig.owner)}/${encodeURIComponent(gitHubSyncConfig.repo)}/${encodeURIComponent(gitHubSyncConfig.branch)}/${encodeGitHubPath(path)}`;
};

const sanitizeGitHubFileName = (value) => {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Image upload failed"));
        reader.readAsDataURL(file);
    });
};

const readFileAsBase64 = async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    const parts = dataUrl.split(",");

    if (parts.length < 2) {
        throw new Error("Image upload failed");
    }

    return parts[1];
};

const fetchPublicJsonFile = async (path, fallbackData) => {
    const publicUrl = isGitHubSyncConfigured() ? getGitHubRawUrl(path) : path;
    const response = await fetch(`${publicUrl}?t=${Date.now()}`, { cache: "no-store" });

    if (!response.ok) {
        return cloneGitHubSyncData(fallbackData);
    }

    try {
        return await response.json();
    } catch {
        return cloneGitHubSyncData(fallbackData);
    }
};

const readRepoJsonFile = async (path, fallbackData) => {
    if (!isGitHubSyncConfigured()) {
        throw new Error("GitHub sync is not configured");
    }

    const response = await fetch(`${getGitHubContentsApiUrl(path)}?ref=${encodeURIComponent(gitHubSyncConfig.branch)}`, {
        headers: getGitHubApiHeaders()
    });

    if (response.status === 404) {
        return {
            data: cloneGitHubSyncData(fallbackData),
            sha: ""
        };
    }

    if (!response.ok) {
        throw new Error(`GitHub read failed with status ${response.status}`);
    }

    const payload = await response.json();

    try {
        const decoded = fromBase64Unicode(payload.content || "");
        const parsed = JSON.parse(decoded || "{}");

        return {
            data: parsed,
            sha: String(payload.sha || "")
        };
    } catch {
        return {
            data: cloneGitHubSyncData(fallbackData),
            sha: String(payload.sha || "")
        };
    }
};

const writeRepoFile = async (path, base64Content, message, sha = "") => {
    if (!isGitHubSyncConfigured()) {
        throw new Error("GitHub sync is not configured");
    }

    const response = await fetch(getGitHubContentsApiUrl(path), {
        method: "PUT",
        headers: getGitHubApiHeaders(true),
        body: JSON.stringify({
            message,
            content: base64Content,
            branch: gitHubSyncConfig.branch,
            ...(sha ? { sha } : {})
        })
    });

    if (!response.ok) {
        throw new Error(`GitHub write failed with status ${response.status}`);
    }

    return response.json();
};

const saveRepoJsonFile = async (path, nextData, message) => {
    const current = await readRepoJsonFile(path, nextData);
    const formatted = JSON.stringify(nextData, null, 4);

    await writeRepoFile(path, toBase64Unicode(formatted), message, current.sha);
    return cloneGitHubSyncData(nextData);
};

const updateRepoJsonFile = async (path, fallbackData, updateFn, message) => {
    const current = await readRepoJsonFile(path, fallbackData);
    const nextData = await updateFn(cloneGitHubSyncData(current.data));
    const formatted = JSON.stringify(nextData, null, 4);

    await writeRepoFile(path, toBase64Unicode(formatted), message, current.sha);
    return cloneGitHubSyncData(nextData);
};

window.GitHubSync = {
    getConfig() {
        return cloneGitHubSyncData(gitHubSyncConfig);
    },
    isConfigured() {
        return isGitHubSyncConfigured();
    },
    async fetchNews(fallbackData) {
        return fetchPublicJsonFile(gitHubSyncConfig.newsPath, fallbackData);
    },
    async saveNews(newsData, employeeName = "Saturn Aerospace") {
        return saveRepoJsonFile(
            gitHubSyncConfig.newsPath,
            newsData,
            `Update Cosmic News from website by ${employeeName}`
        );
    },
    async appendAuditEntry(entry) {
        return updateRepoJsonFile(
            gitHubSyncConfig.auditLogPath,
            [],
            (currentData) => {
                const entries = Array.isArray(currentData) ? currentData : [];
                return [entry, ...entries].slice(0, 250);
            },
            `Add employee audit entry for ${entry.employee || "staff"}`
        );
    },
    async uploadNewsImage(file) {
        if (!file) {
            return "";
        }

        if (!isGitHubSyncConfigured()) {
            return readFileAsDataUrl(file);
        }

        const fileExtension = file.name.includes(".")
            ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
            : ".png";
        const baseName = sanitizeGitHubFileName(file.name.replace(/\.[^.]+$/, "")) || "news-image";
        const fileName = `${Date.now()}-${baseName}${fileExtension}`;
        const filePath = `${gitHubSyncConfig.imageDirectory}/${fileName}`;
        const base64Content = await readFileAsBase64(file);

        await writeRepoFile(filePath, base64Content, `Upload news image from website: ${fileName}`);
        return getGitHubRawUrl(filePath);
    }
};
