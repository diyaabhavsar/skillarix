 const getFileExtension = (filename?: string) => {
    if (!filename) return "";
    return filename.split(".").pop()?.toLowerCase() || "";
  };

export const renderFilePreview = (url?: string, filename?: string) => {
    const ext = getFileExtension(filename);
    if (!url) return null;
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      return (
        <div className="flex items-center gap-4">
          <img
            src={url}
            alt={filename}
            className="w-24 h-24 object-cover rounded border"
          />
          <div>
            <p className="font-medium break-all">{filename}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 underline text-sm mt-1"
            >
              <span className="material-icons">image</span>View Image
            </a>
          </div>
        </div>
      );
    }
    if (["pdf"].includes(ext)) {
      return (
        <div className="flex items-center gap-4 rounded p-4 border border-gray-300">
          <div className="flex flex-col items-center justify-center w-16 h-10 rounded bg-red-50 border border-red-200">
            <span className="text-xs text-red-600 mt-1 font-bold">
              {ext.toUpperCase()}
            </span>
          </div>
          <div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-600 underline text-sm mt-1 hover:text-gray-800"
            >
            <p className="font-medium break-all text-red-700">{filename}</p>
            </a>
          </div>
        </div>
      );
    }
    if (["doc", "docx"].includes(ext)) {
      return (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-blue-50 border border-blue-200">
            <span className="material-icons text-blue-600 text-3xl">
              description
            </span>
            <span className="text-xs text-blue-600 mt-1">
              {ext.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium break-all text-blue-700">{filename}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 underline text-sm mt-1 hover:text-gray-800"
            >
              <span className="material-icons">download</span>View / Download DOC
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded bg-gray-50 border border-gray-200">
          <span className="material-icons text-gray-600 text-3xl">
            insert_drive_file
          </span>
        </div>
        <div>
          <p className="font-medium break-all">{filename}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-600 underline text-sm mt-1"
          >
            <span className="material-icons">download</span>View / Download File
          </a>
        </div>
      </div>
    );
  };