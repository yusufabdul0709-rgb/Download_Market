const SkeletonLoader = ({ type = 'card', statusMessage = '' }) => {
  if (type === 'card') {
    return (
      <div className="w-full">
        <div className="w-full glass rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-video skeleton" />
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded-lg w-3/4" />
                <div className="h-3 skeleton rounded-lg w-1/2" />
              </div>
            </div>
          </div>
        </div>
        {/* Live status message below card */}
        {statusMessage && (
          <p className="mt-3 text-center text-sm text-text-muted animate-pulse flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
            {statusMessage}
          </p>
        )}
      </div>
    );
  }

  if (type === 'vertical-card') {
    return (
      <div className="w-full">
        <div className="w-full max-w-sm mx-auto glass rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-[9/16] skeleton" />
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded-lg w-3/4" />
                <div className="h-3 skeleton rounded-lg w-1/2" />
              </div>
            </div>
          </div>
        </div>
        {statusMessage && (
          <p className="mt-3 text-center text-sm text-text-muted animate-pulse flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
            {statusMessage}
          </p>
        )}
      </div>
    );
  }

  if (type === 'download-options') {
    return (
      <div className="w-full space-y-3 animate-pulse">
        <div className="h-5 skeleton rounded-lg w-40 mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 glass rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl skeleton" />
              <div className="space-y-2">
                <div className="h-4 skeleton rounded-lg w-24" />
                <div className="h-3 skeleton rounded-lg w-16" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="w-full max-w-md mx-auto glass rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton rounded-lg w-3/4" />
            <div className="h-3 skeleton rounded-lg w-1/2" />
          </div>
        </div>
        <div className="h-2 skeleton rounded-full w-full" />
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full skeleton" />
        </div>
        {statusMessage && (
          <p className="text-center text-sm text-text-muted animate-pulse flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
            {statusMessage}
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
