# **README: Injected js.js and css.css Files**

This document details the changes and enhancements provided by the injected js.js and css.css files, designed to transform a traditional table-based listing into a modern, card-based infinite scroll experience with enhanced image viewing.

## **js.js \- JavaScript Enhancements**

The js.js file introduces significant functional and UI improvements:

### **1\. Layout Transformation**

* **Sidebar to Horizontal Container:** The content from the original right-hand sidebar (aside.col-3) is extracted and moved into a new div with the class horizontal-sidebar-container. This container is then inserted at the top of the main content area, effectively transforming a vertical sidebar into a horizontal section.  
* **Table to Card View:** The script dynamically processes each row of the existing .table-list tbody and converts it into a visually appealing "torrent card" (.torrent-card). These cards are appended to a new div called .torrent-cards-container, replacing the traditional table layout.

### **2\. Infinite Scrolling**

* **Dynamic Content Loading:** Implements infinite scrolling functionality. As the user scrolls towards the bottom of the page, new torrent listings are fetched from subsequent pagination pages using fetch requests.  
* **Loading Spinner:** A .loading-spinner element is added and displayed while new content is being fetched, providing visual feedback to the user.  
* **Pagination Handling:** The script intelligently determines the currentPage and lastPage by parsing the existing pagination links on the page, ensuring it fetches pages correctly until the end.

### **3\. Image Gallery and Modal Viewer**

* **Image Extraction:** For each torrent card, the script fetches the corresponding detail page to extract all relevant image URLs from .descrimg elements and js-modal-url links. It also includes logic to convert low-resolution image URLs (e.g., from Photobucket or Imgtraffic) to higher-resolution versions where possible.  
* **Horizontal Image Gallery:** Each torrent card features a horizontal, scrollable image gallery (.image-gallery-stack) displaying the extracted images.  
* **Lazy Loading with Skeleton:** Images within the galleries are lazy-loaded using IntersectionObserver. A image-skeleton placeholder is shown until the image is fully loaded, improving perceived performance.  
* **"Grab-to-Scroll" Interaction:** The image galleries support a "grab-to-scroll" interaction, allowing users to drag with their mouse or touch to navigate through images, complete with a natural deceleration effect.  
* **Full-Screen Image Modal:** Clicking on any image in a card's gallery opens a full-screen modal (.image-modal-overlay).  
  * **Carousel Navigation:** The modal includes "Previous" and "Next" buttons, as well as carousel indicators, for easy navigation between images.  
  * **Auto-Scrolling:** Images in the modal auto-advance after a set duration, with a visible progress bar. This auto-scroll pauses on mouse hover/touch.  
  * **Keyboard Navigation:** Supports Escape to close the modal, and ArrowLeft/ArrowRight for navigation.  
  * **Preloading:** Preloads adjacent images in the carousel for a smoother viewing experience.

### **4\. Scroll-to-Top Button**

* **Dynamic Visibility:** A "Scroll-to-Top" button (\#scroll-to-top) is added to the bottom-right of the page. It appears when the user scrolls down more than 300 pixels and smoothly scrolls the page back to the top when clicked.

## **css.css \- Styling and Layout Adjustments**

The css.css file provides the necessary styling to support the JavaScript enhancements and modernize the overall look:

### **1\. CSS Custom Properties (Variables)**

* Defines a comprehensive set of CSS variables for colors, spacing, and border-radii, making the styling more consistent and easier to modify.

### **2\. Global & Layout Overrides**

* **Full-Width Container:** Forces all .container elements to be full-width (max-width: 100% \!important; width: 100% \!important;).  
* **Sidebar Transformation Styling:**  
  * Hides the original sidebar (aside.col-3).  
  * Styles the new .horizontal-sidebar-container to display its children (the former sidebar content) in a horizontal flex layout with appropriate spacing.  
* **Main Content Area:** Ensures the .col-9.page-content takes full width.  
* **Original Table Hiding:** The original .table-list-wrap is hidden to make way for the new card layout.

### **3\. Card Grid and Individual Card Styling**

* **Grid Layout:** .torrent-cards-container is styled as a simple grid with a single column, ensuring cards stack vertically with generous row-gap.  
* **Card Aesthetics:** .torrent-card elements are styled with background colors, rounded corners, shadows, and subtle hover effects for a modern look.

### **4\. Image Gallery Stack Styling**

* **Horizontal Scroll:** Styles .image-gallery-stack to enable horizontal scrolling with scroll-snap-type for smooth image alignment.  
* **Image Sizing:** Sets max-height for images within the stack and ensures they object-fit: contain.  
* **Lazy Load Skeleton:** Styles the image-skeleton placeholder with a shimmering animation.  
* **No Image Placeholder:** Provides styling for a .no-image-placeholder when no images are available for a torrent.

### **5\. Image Expansion Modal Styling**

* **Overlay and Content:** Styles the .image-modal-overlay for a dark, translucent background and centers the .image-modal-content with a subtle scale-in transition.  
* **Modal Image:** Ensures the image within the modal is responsive and object-fit: contain.  
* **Loading Spinner:** Styles the modal-image-spinner that appears when a modal image is loading.  
* **Close Button:** Styles the image-modal-close-btn for clear visibility and interaction.  
* **Navigation Buttons:** Styles the modal-nav-btn (previous/next arrows) with semi-transparent backgrounds, rounded corners, and hover effects.  
* **Carousel Indicators:** Styles the modal-carousel-indicators (dots) and their active state.  
* **Auto-Scroll Progress Bar:** Introduces styling for the modal-carousel-progress bar, including its fill animation.

### **6\. Spinner and Scroll-to-Top Button Styling**

* **Loading Spinner:** Provides basic styling and animation for the .loading-spinner.  
* **Scroll-to-Top Button:** Styles the \#scroll-to-top button with a circular shape, shadow, and smooth opacity/visibility transitions.

These injected files work in tandem to significantly enhance the user experience by modernizing the layout, improving content discovery through infinite scrolling, and providing a rich, interactive image viewing experience.
