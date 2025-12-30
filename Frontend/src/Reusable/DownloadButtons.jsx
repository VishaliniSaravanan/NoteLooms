import PropTypes from 'prop-types';

const DownloadButtons = ({ contentType, handleDownload }) => {
  const handleButtonClick = async (format) => {
    try {
      await handleDownload(contentType, format);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 px-2">
      {["pdf", "txt", "docx"].map((format) => (
        <button
          key={format}
          onClick={() => handleButtonClick(format)}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs rounded-md font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
          aria-label={`Download as ${format.toUpperCase()}`}
        >
          {format.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

DownloadButtons.propTypes = {
  contentType: PropTypes.string.isRequired,
  handleDownload: PropTypes.func.isRequired,
};

export default DownloadButtons;