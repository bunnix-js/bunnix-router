export const isVdomNode = (value) => (
    value
    && typeof value === 'object'
    && 'tag' in value
    && 'props' in value
    && 'children' in value
);

const isWhitespaceText = (value) => (
    typeof value === 'string'
    && value.trim() === ''
);

export const normalizeJsxChildren = (children) => {
    const normalized = [];
    const stack = Array.isArray(children) ? [...children] : [children];

    while (stack.length) {
        const child = stack.shift();
        if (Array.isArray(child)) {
            stack.unshift(...child);
            continue;
        }
        if (child === null || child === undefined || child === false) continue;
        if (isWhitespaceText(child)) continue;
        normalized.push(child);
    }

    return normalized;
};
