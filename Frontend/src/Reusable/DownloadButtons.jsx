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
    <div className="flex justify-center gap-4 mt-6">
      {["pdf", "txt", "docx"].map((format) => (
        <button
          key={format}
          onClick={() => handleButtonClick(format)}
          className="px-6 py-2 rounded-lg font-medium text-white glass-button transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Download as ${format.toUpperCase()}`}
        >
          Download as {format.toUpperCase()}
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