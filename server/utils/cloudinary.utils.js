// utils/cloudinary.utils.js

function extractPublicId(pathOrUrl) {
    try {
        // If it's a full URL, extract the public_id from it
        if (pathOrUrl.startsWith("http")) {
            const url = new URL(pathOrUrl);
            const parts = url.pathname.split("/");
            const uploadIndex = parts.indexOf("upload");
            if (uploadIndex === -1) throw new Error("Not a valid Cloudinary URL");

            const afterUpload = parts.slice(uploadIndex + 1);
            if (/^v\d+$/.test(afterUpload[0])) afterUpload.shift(); // remove version

            // Remove file extension
            const last = afterUpload[afterUpload.length - 1];
            afterUpload[afterUpload.length - 1] = last.replace(/\.[^/.]+$/, "");

            return afterUpload.join("/");
        }

        // Already a public_id — return as-is
        return pathOrUrl;

    } catch (err) {
        console.error("Failed to extract public_id from:", pathOrUrl, err);
        return null;
    }
}

module.exports = { extractPublicId };