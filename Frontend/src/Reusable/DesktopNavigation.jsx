const DesktopNavigation = ({ activeSection, setActiveSection }) => {
  return (
    <nav className={`glass hidden lg:flex flex-wrap justify-center gap-1 p-4 rounded-2xl shadow-lg mb-12`}>
      {[
        "summary",
        "notes",
        "mcqs",
        "flashcards",
        "document_viewer",
        "image_description",
      ].map((section) => (
        <button
          key={section}
          onClick={() => setActiveSection(section)}
          className={`px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-full font-medium transition-all duration-300 ${
            activeSection === section
              ? `glass-button text-white shadow-md`
              : `text-[--text-secondary] hover:bg-[--hover-bg]`
          }`}
        >
          {section === "image_description"
            ? "Image Description"
            : section === "document_viewer"
            ? "Source Document"
            : section.charAt(0).toUpperCase() + section.slice(1)}
        </button>
      ))}
    </nav>
  );
};

export default DesktopNavigation;