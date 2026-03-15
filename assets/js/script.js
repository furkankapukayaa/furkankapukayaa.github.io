'use strict';


// element toggle function
const elementToggleFunc = function(elem) {
	elem.classList.toggle("active");
}


// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function() {
	elementToggleFunc(sidebar);
});


// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalName = document.querySelector("[data-modal-name]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function() {
	modalContainer.classList.toggle("active");
	overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

	testimonialsItem[i].addEventListener("click", function() {

		modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
		modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
		modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
		modalName.innerHTML = this.querySelector("[data-testimonials-name]").innerHTML;
		modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

		testimonialsModalFunc();

	});

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);


// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function() {
	elementToggleFunc(this);
});

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
	selectItems[i].addEventListener("click", function() {

		let selectedValue = this.innerText.toLowerCase();
		selectValue.innerText = this.innerText;
		elementToggleFunc(select);
		filterFunc(selectedValue);

	});
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function(selectedValue) {

	for (let i = 0; i < filterItems.length; i++) {

		if (selectedValue === "all") {
			filterItems[i].classList.add("active");
		} else if (selectedValue === filterItems[i].dataset.category) {
			filterItems[i].classList.add("active");
		} else {
			filterItems[i].classList.remove("active");
		}

	}

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

	filterBtn[i].addEventListener("click", function() {

		let selectedValue = this.innerText.toLowerCase();
		selectValue.innerText = this.innerText;
		filterFunc(selectedValue);

		lastClickedBtn.classList.remove("active");
		this.classList.add("active");
		lastClickedBtn = this;

	});

}


// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
	formInputs[i].addEventListener("input", function() {

		// check form validation
		if (form.checkValidity()) {
			formBtn.removeAttribute("disabled");
		} else {
			formBtn.setAttribute("disabled", "");
		}

	});
}


// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
	navigationLinks[i].addEventListener("click", function(e) {
		e.preventDefault(); // Tarayıcının içeriğe otomatik aşağı kayma davranışını engelle
		
		// Sayfa yenilendiğinde aynı sekmede kalması için URL'i manuel olarak güncelle
		history.pushState(null, null, this.getAttribute("href"));

		for (let j = 0; j < pages.length; j++) {
			if (this.innerHTML.toLowerCase() === pages[j].dataset.page) {
				pages[j].classList.add("active");
				navigationLinks[j].classList.add("active");
				window.scrollTo(0, 0);
			} else {
				pages[j].classList.remove("active");
				navigationLinks[j].classList.remove("active");
			}
		}

	});
}

// Sayfa yüklendiğinde tarayıcının otomatik olarak hash elementine kaymasını engelle
if ('scrollRestoration' in history) {
	history.scrollRestoration = 'manual';
}

// Sayfa ilk yüklendiğinde URL'deki hash (#) değerini kontrol et
if (window.location.hash) {
	const hashPage = window.location.hash.substring(1); // '#' işaretini kaldırır
	for (let i = 0; i < pages.length; i++) {
		if (pages[i].dataset.page === hashPage) {
			pages[i].classList.add("active");
			// Navbar linkini de aktif yap
			for (let j = 0; j < navigationLinks.length; j++) {
				if (navigationLinks[j].innerHTML.toLowerCase() === hashPage) {
					navigationLinks[j].classList.add("active");
				} else {
					navigationLinks[j].classList.remove("active");
				}
			}
			setTimeout(() => window.scrollTo(0, 0), 10); // Tarayıcı gecikmesini önlemek için ufak bir bekleme
		} else {
			pages[i].classList.remove("active");
		}
	}
}

// service list auto scroll function
const serviceList = document.querySelector("[data-service-list]");

if (serviceList) {
	// Sürekli (marquee) kayma efekti için elemanları kopyalıyoruz
	const items = Array.from(serviceList.children);
	items.forEach(item => {
		const clone = item.cloneNode(true);
		serviceList.appendChild(clone);
	});

	let isHovered = false;
	let scrollPos = 0;
	let scrollSpeed = 0.5; // Ortalama kayma hızı (çok hızlı olmaması için)

	const autoScroll = () => {
		if (!isHovered) {
			scrollPos += scrollSpeed;
			
			// Kopyalanan elemanların tam başladığı noktayı hesapla
			const firstClone = serviceList.children[items.length];
			const resetPoint = firstClone.offsetLeft - items[0].offsetLeft;

			if (scrollPos >= resetPoint) {
				scrollPos -= resetPoint; // Kesintisiz sonsuz döngü için sıfırla
			}
			serviceList.scrollLeft = scrollPos;
		}
		requestAnimationFrame(autoScroll);
	};

	requestAnimationFrame(autoScroll);

	// Kullanıcı fareyle üzerine gelince veya dokununca durdur, çekince tekrar başlat
	serviceList.addEventListener("mouseenter", () => isHovered = true);
	serviceList.addEventListener("mouseleave", () => { isHovered = false; scrollPos = serviceList.scrollLeft; });
	serviceList.addEventListener("touchstart", () => isHovered = true, { passive: true });
	serviceList.addEventListener("touchend", () => { isHovered = false; scrollPos = serviceList.scrollLeft; });
	serviceList.addEventListener("scroll", () => { if (isHovered) scrollPos = serviceList.scrollLeft; }, { passive: true });
}

// clients list auto scroll function (non-stop)
const clientsList = document.querySelector("[data-clients-list]");

if (clientsList) {
	// Sürekli (marquee) kayma efekti için elemanları kopyalıyoruz
	const clientItems = Array.from(clientsList.children);
	clientItems.forEach(item => {
		const clone = item.cloneNode(true);
		clientsList.appendChild(clone);
	});

	let clientScrollPos = 0;
	let clientScrollSpeed = 0.5; // Kayma hızı

	const autoScrollClients = () => {
		clientScrollPos += clientScrollSpeed;
		
		// Kopyalanan elemanların tam başladığı noktayı hesapla
		const firstClone = clientsList.children[clientItems.length];
		const resetPoint = firstClone.offsetLeft - clientItems[0].offsetLeft;

		if (clientScrollPos >= resetPoint) {
			clientScrollPos -= resetPoint; // Kesintisiz sonsuz döngü için sıfırla
		}
		clientsList.scrollLeft = clientScrollPos;
		
		requestAnimationFrame(autoScrollClients);
	};

	requestAnimationFrame(autoScrollClients);
}