const formatDate = (iso: string | Date): string => {
    const date = typeof iso === 'string' ? new Date(iso) : iso;

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default formatDate;
