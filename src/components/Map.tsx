interface MapProps {
    query: string;
    location: string;
}

export default function Map({ query, location }: MapProps) {
    // Construct a cleaner query for the map
    const searchTerm = [query, location].filter(Boolean).join(" ");
    const searchQuery = encodeURIComponent(searchTerm);

    // Zoom level: 12 is optimal for Cities / Neighborhoods. 
    // If user just searches "Austin", we want z=11 or 12 to see the whole city.
    // If they search "Coffee in Austin", z=13 might be better.
    // Let's stick to z=12 as a safe "city focus" default or remove z to let Google decide (though Google Embed 'search' mode can be erratic without visual context).
    const zoomLevel = location && !query ? 11 : 13;

    return (
        <div className="w-full h-full min-h-[400px] bg-muted relative">
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '100vh' }}
                loading="lazy"
                allowFullScreen
                // Using 'z' parameter to force appropriate zoom
                src={`https://www.google.com/maps/embed/v1/search?key=${process.env.NEXT_PUBLIC_MAPS_EMBED_KEY || ''}&q=${searchQuery}&zoom=${zoomLevel}`}
                className="absolute inset-0"
            ></iframe>
            {/* Fallback/Overlay if no specific key is used or for styling */}
            {!process.env.NEXT_PUBLIC_MAPS_EMBED_KEY && (
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '100vh' }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${searchQuery}&t=&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`}
                    className="absolute inset-0 grayscale-[20%] contrast-[1.1]"
                ></iframe>
            )}
        </div>
    );
}
