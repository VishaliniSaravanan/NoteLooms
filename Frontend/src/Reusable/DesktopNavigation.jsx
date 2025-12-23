const DesktopNavigation = ({ activeSection, setActiveSection }) => {
  return (
    <nav className={`glass hidden lg:flex flex-wrap justify-center gap-1 p-4 rounded-2xl shadow-lg mb-12`}>
      {[
        "summary",
        "notes",
        "mcqs",
        "flashcards",
        "image_description",
      ].map((section) => (
        <button
          key={section}
          onClick={() => setActiveSection(section)}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            activeSection === section
              ? `glass-button text-white shadow-md`
              : `text-[--text-secondary] hover:bg-[--hover-bg]`
          }`}
        >
          {section === "image_description"
            ? "Image Description"
            : section.charAt(0).toUpperCase() + section.slice(1)}
        </button>
      ))}
    </nav>
  );
};

export default DesktopNavigation;