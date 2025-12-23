import { motion } from "framer-motion";

const FileIcon = () => (
  <svg className="w-8 h-8 text-[--text-tertiary]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const SourcePreview = ({ file, index, selectedFileIndex, handleUploadedFileClick, isMobile, layoutMode }) => {
  return (
    <motion.div
      className={`glass p-2 rounded-xl mb-2 cursor-pointer hover:bg-[--hover-bg] transition-all duration-200 border border-[--border-color] sm:p-3 ${
        selectedFileIndex === index ? 'ring-2 ring-[--accent-primary] border-[--accent-primary] shadow-lg' : 'hover:border-[--accent-primary]/50'
      }`}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => handleUploadedFileClick(index)}
    >
      <div className={`text-xs font-medium mb-1 flex flex-wrap items-center gap-1 ${!isMobile && layoutMode === "studio" ? 'text-white' : 'text-black'}`}>
        {file.type === 'youtube' && (
          <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"> 
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )}
        <span className="truncate flex-1 min-w-0">{file.filename}</span> 
      </div>
      <div className="relative w-full h-full">
        {file.type === 'youtube' ? (
          <img src={`https://img.youtube.com/vi/${file.youtube_id || file.id}/mqdefault.jpg`} alt="YT Preview" className="w-full h-32 object-cover rounded-lg" />  
        ) : file.is_image ? (
          <img src={file.base64_image} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-32 bg-[--bg-secondary] rounded-lg flex items-center justify-center text-[--text-tertiary]">  
            <FileIcon className="w-8 h-8" />
          </div>
        )}
        <div className="lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:bg-black/70 lg:text-white lg:p-2 lg:rounded-b-lg">
          <p className="text-xs font-medium truncate hidden lg:block">{file.filename}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SourcePreview;