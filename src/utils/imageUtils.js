/**
 * Utility functions for handling, normalizing, and prioritizing hotel and room images.
 * Ensures images with isThumbnail: true (or matching thumbImage) are always placed first.
 */

export const getImageUrl = (raw) => {
    if (!raw) return '';
    let url = typeof raw === 'object'
        ? (raw.url || raw.originalUrl || raw.path || raw.src || raw.href || '')
        : String(raw);
    if (!url || typeof url !== 'string') return '';
    url = url.trim();
    if (url.startsWith('http://')) {
        url = 'https://' + url.slice(7);
    } else if (url.startsWith('//')) {
        url = 'https:' + url;
    }
    return url;
};

export const normalizeUrlKey = (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.split('?')[0].split('#')[0].replace(/\/+$/, '').toLowerCase();
};

export const isThumbnailImage = (img, thumbHint = null) => {
    if (!img) return false;
    if (typeof img === 'object') {
        if (
            img.isThumbnail === true ||
            img.isThumbnail === 1 ||
            String(img.isThumbnail).toLowerCase() === 'true' ||
            img.is_thumbnail === true ||
            String(img.is_thumbnail).toLowerCase() === 'true' ||
            img.heroImage === true ||
            String(img.heroImage).toLowerCase() === 'true' ||
            img.isHeroImage === true ||
            String(img.isHeroImage).toLowerCase() === 'true'
        ) {
            return true;
        }
        if (thumbHint) {
            const url = getImageUrl(img);
            const hintUrl = getImageUrl(thumbHint);
            if (url && hintUrl && normalizeUrlKey(url) === normalizeUrlKey(hintUrl)) {
                return true;
            }
        }
        return false;
    }
    if (typeof img === 'string' && thumbHint) {
        return normalizeUrlKey(img) === normalizeUrlKey(getImageUrl(thumbHint));
    }
    return false;
};

/**
 * Sorts an array of images (objects or strings) so that images with `isThumbnail: true`
 * or matching `thumbHint` (e.g. room.thumbImage or hotel.thumbnail) come FIRST.
 * Returns a deduplicated array.
 */
export const sortImagesWithThumbnailFirst = (images = [], thumbHint = null) => {
    if (!images || !Array.isArray(images) || images.length === 0) {
        if (thumbHint) {
            const hintUrl = getImageUrl(thumbHint);
            if (hintUrl) {
                return typeof thumbHint === 'object' ? [thumbHint] : [{ url: hintUrl, isThumbnail: true }];
            }
        }
        return [];
    }

    const thumbs = [];
    const others = [];
    const seen = new Set();

    const hintUrl = getImageUrl(thumbHint);
    const hintKey = hintUrl ? normalizeUrlKey(hintUrl) : null;

    for (const item of images) {
        if (!item) continue;
        const url = getImageUrl(item);
        if (!url) continue;
        const key = normalizeUrlKey(url);
        if (seen.has(key)) continue;
        seen.add(key);

        const isThumb = isThumbnailImage(item, thumbHint) || (hintKey && key === hintKey);
        if (isThumb) {
            if (typeof item === 'object') {
                thumbs.push({ ...item, isThumbnail: true });
            } else {
                thumbs.push(item);
            }
        } else {
            others.push(item);
        }
    }

    // If thumbHint was not in the images array, prepend it as thumbnail
    if (hintKey && !seen.has(hintKey)) {
        seen.add(hintKey);
        const hintObj = typeof thumbHint === 'object'
            ? { ...thumbHint, isThumbnail: true }
            : { url: hintUrl, isThumbnail: true };
        thumbs.unshift(typeof images[0] === 'string' ? hintUrl : hintObj);
    }

    return [...thumbs, ...others];
};

/**
 * Given a list of images or a fallback, returns the primary/thumbnail image URL string.
 */
export const getPrimaryImageUrl = (images = [], fallback = '') => {
    if (!images || !Array.isArray(images) || images.length === 0) {
        return getImageUrl(fallback);
    }
    const sorted = sortImagesWithThumbnailFirst(images, fallback);
    return getImageUrl(sorted[0]) || getImageUrl(fallback);
};

export default {
    getImageUrl,
    normalizeUrlKey,
    isThumbnailImage,
    sortImagesWithThumbnailFirst,
    getPrimaryImageUrl
};
