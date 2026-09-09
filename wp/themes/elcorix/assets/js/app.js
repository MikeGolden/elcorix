/*
 * The site's behaviour, in one deferred file.
 *
 * This is the port of what React used to do: the sticky header, the anchor
 * menu, the language listbox, the scroll reveals, the works slider, the
 * full-screen image viewer, the cookie-consent gate in front of the
 * Altegio embed, and the two forms.
 *
 * Everything it touches is already in the markup — it reveals, toggles and
 * submits, it does not build. Turn JavaScript off and the page still has
 * every link, every price and both forms' fields; only the conveniences
 * (the viewer, the slider arrows, the in-place submit) go away, and the
 * Altegio embed stays unloaded, which is the safe direction.
 *
 * No framework and no build step: this file is served as written.
 */
(function () {
	"use strict";

	var data = window.elcorixData || {};
	var strings = data.strings || {};

	/* ------------------------------------------------------------------ */
	/* Sticky header                                                       */
	/* ------------------------------------------------------------------ */

	/*
	 * The header is transparent over the hero photo and only paints its
	 * background once the page scrolls away from the top. Coalesced to one
	 * read per frame: the handler fires on every scroll event otherwise, and
	 * this one runs for the whole length of the page.
	 */
	function initHeader() {
		var header = document.querySelector("[data-elcorix-header]");
		if (!header) return;

		var frame = 0;
		function read() {
			frame = 0;
			var scrolled = window.scrollY > 8;
			header.classList.toggle("bg-white/95", scrolled);
			header.classList.toggle("backdrop-blur", scrolled);
			header.classList.toggle("bg-transparent", !scrolled);
		}
		function onScroll() {
			if (frame === 0) frame = window.requestAnimationFrame(read);
		}
		read();
		window.addEventListener("scroll", onScroll, { passive: true });
	}

	/* ------------------------------------------------------------------ */
	/* Anchor menu                                                         */
	/* ------------------------------------------------------------------ */

	function initMenu() {
		var toggle = document.querySelector("[data-elcorix-menu-toggle]");
		var menu = document.querySelector("[data-elcorix-menu]");
		var actions = document.querySelector("[data-elcorix-header-actions]");
		if (!toggle || !menu) return;

		var openIcon = toggle.querySelector('[data-elcorix-menu-icon="open"]');
		var closeIcon = toggle.querySelector('[data-elcorix-menu-icon="close"]');

		function setOpen(open) {
			menu.hidden = !open;
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
			if (openIcon) openIcon.hidden = open;
			if (closeIcon) closeIcon.hidden = !open;
		}

		toggle.addEventListener("click", function () {
			setOpen(menu.hidden);
		});

		// A click anywhere outside the header's action cluster closes it.
		document.addEventListener("pointerdown", function (event) {
			if (menu.hidden) return;
			if (actions && actions.contains(event.target)) return;
			setOpen(false);
		});

		document.addEventListener("keydown", function (event) {
			if (event.key !== "Escape" || menu.hidden) return;
			setOpen(false);
			toggle.focus();
		});

		// Following an anchor within the page leaves the menu open otherwise.
		menu.addEventListener("click", function (event) {
			if (event.target.closest("a")) setOpen(false);
		});
	}

	/* ------------------------------------------------------------------ */
	/* Language listbox                                                    */
	/* ------------------------------------------------------------------ */

	function initLanguageSwitcher() {
		var root = document.querySelector("[data-elcorix-language]");
		if (!root) return;

		var trigger = root.querySelector("[data-elcorix-language-trigger]");
		var list = root.querySelector("[data-elcorix-language-list]");
		var chevron = root.querySelector("[data-elcorix-language-chevron]");
		if (!trigger || !list) return;

		var options = Array.prototype.slice.call(
			list.querySelectorAll('[role="option"]')
		);

		function setOpen(open) {
			list.hidden = !open;
			trigger.setAttribute("aria-expanded", open ? "true" : "false");
			if (chevron) chevron.classList.toggle("rotate-180", open);
			if (open) {
				// Focus starts on the current language, as it did before.
				var index = options.findIndex(function (option) {
					return option.getAttribute("aria-selected") === "true";
				});
				var target = options[Math.max(index, 0)];
				if (target) target.focus();
			}
		}

		function go(option) {
			var href = option.getAttribute("data-elcorix-language-option");
			if (href) window.location.href = href;
		}

		trigger.addEventListener("click", function () {
			setOpen(list.hidden);
		});

		document.addEventListener("pointerdown", function (event) {
			if (list.hidden || root.contains(event.target)) return;
			setOpen(false);
		});

		options.forEach(function (option) {
			option.addEventListener("click", function (event) {
				// The <a> inside is the no-JavaScript path; let it do its job.
				if (event.target.closest("a")) return;
				go(option);
			});
		});

		list.addEventListener("keydown", function (event) {
			var count = options.length;
			var focused = options.indexOf(document.activeElement);

			switch (event.key) {
				case "Escape":
					event.preventDefault();
					setOpen(false);
					trigger.focus();
					break;
				case "ArrowDown":
					event.preventDefault();
					options[(focused + 1 + count) % count].focus();
					break;
				case "ArrowUp":
					event.preventDefault();
					options[(focused - 1 + count) % count].focus();
					break;
				case "Home":
					event.preventDefault();
					options[0].focus();
					break;
				case "End":
					event.preventDefault();
					options[count - 1].focus();
					break;
				case "Enter":
				case " ":
					event.preventDefault();
					if (options[focused]) go(options[focused]);
					break;
			}
		});
	}

	/* ------------------------------------------------------------------ */
	/* Scroll reveal                                                       */
	/* ------------------------------------------------------------------ */

	/*
	 * One observer for the whole page instead of one per element: the
	 * landing page carries around twenty reveals with identical options, so
	 * a shared observer is exactly equivalent and costs the browser a single
	 * set of intersection computations.
	 *
	 * The negative bottom margin holds the reveal back until the element is
	 * properly on screen rather than one pixel into it; the low threshold
	 * keeps blocks taller than the viewport from waiting forever. It is
	 * one-shot on purpose — scrolling back up never replays the movement.
	 *
	 * Without IntersectionObserver, everything is revealed immediately:
	 * content must never be lost to an animation.
	 */
	function initReveals() {
		var elements = document.querySelectorAll(".reveal, .reveal-fade");
		if (!elements.length) return;

		if (typeof IntersectionObserver === "undefined") {
			elements.forEach(function (element) {
				element.setAttribute("data-revealed", "true");
			});
			return;
		}

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					entry.target.setAttribute("data-revealed", "true");
					observer.unobserve(entry.target);
				});
			},
			{ threshold: 0.05, rootMargin: "0px 0px -8% 0px" }
		);

		elements.forEach(function (element) {
			observer.observe(element);
		});
	}

	/* ------------------------------------------------------------------ */
	/* Cookie consent                                                      */
	/* ------------------------------------------------------------------ */

	var CONSENT_KEY = "cookie-consent";

	function readConsent() {
		try {
			var raw = window.localStorage.getItem(CONSENT_KEY);
			if (raw === null) return null;
			var parsed = JSON.parse(raw);
			if (
				parsed &&
				typeof parsed === "object" &&
				parsed.version === 1 &&
				typeof parsed.booking === "boolean"
			) {
				return parsed;
			}
			return null;
		} catch (error) {
			return null;
		}
	}

	function writeConsent(booking) {
		var next = {
			version: 1,
			// The timestamp is the consent record itself.
			decidedAt: new Date().toISOString(),
			booking: booking,
		};
		try {
			window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
		} catch (error) {
			// Storage blocked — the decision still applies for this page view.
		}
		return next;
	}

	function initConsent() {
		var banner = document.querySelector("[data-elcorix-consent]");
		var consent = readConsent();

		function applyAltegio() {
			var allowed = consent !== null && consent.booking === true;
			document
				.querySelectorAll("[data-elcorix-altegio]")
				.forEach(function (root) {
					var placeholder = root.querySelector(
						"[data-elcorix-altegio-placeholder]"
					);
					var embed = root.querySelector("[data-elcorix-altegio-embed]");
					if (placeholder) placeholder.hidden = allowed;
					if (!embed) return;
					embed.hidden = !allowed;
					if (!allowed) return;
					var iframe = embed.querySelector("iframe");
					// The src is held in a data attribute until this moment, so
					// nothing is requested from alteg.io before consent — the
					// whole point of the two-click pattern.
					if (iframe && !iframe.src) {
						iframe.src = iframe.getAttribute("data-elcorix-altegio-src") || "";
					}
				});
		}

		function showBanner(show) {
			if (banner) banner.hidden = !show;
		}

		showBanner(consent === null);
		applyAltegio();

		document
			.querySelectorAll("[data-elcorix-consent-decide]")
			.forEach(function (button) {
				button.addEventListener("click", function () {
					consent = writeConsent(
						button.getAttribute("data-elcorix-consent-decide") === "allow"
					);
					showBanner(false);
					applyAltegio();
				});
			});

		document
			.querySelectorAll("[data-elcorix-consent-open]")
			.forEach(function (button) {
				button.addEventListener("click", function () {
					showBanner(true);
				});
			});
	}

	/* ------------------------------------------------------------------ */
	/* Works slider                                                        */
	/* ------------------------------------------------------------------ */

	function initSlider() {
		var track = document.querySelector("[data-elcorix-slider]");
		if (!track) return;

		var prev = document.querySelector('[data-elcorix-slider-step="-1"]');
		var next = document.querySelector('[data-elcorix-slider-step="1"]');

		/*
		 * Reading scrollWidth/clientWidth forces the browser to flush layout,
		 * and a scroll handler runs on every frame of a momentum swipe —
		 * exactly when the main thread can least afford it. Coalesce to one
		 * read per frame.
		 */
		var frame = 0;
		function sync() {
			frame = 0;
			var max = track.scrollWidth - track.clientWidth;
			if (prev) prev.disabled = track.scrollLeft <= 1;
			// `max <= 1` means everything fits — both arrows stay disabled.
			if (next) next.disabled = track.scrollLeft >= max - 1;
		}
		function schedule() {
			if (frame === 0) frame = window.requestAnimationFrame(sync);
		}

		function page(direction) {
			var first = track.firstElementChild;
			var step = first ? first.clientWidth : track.clientWidth;
			var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
			track.scrollBy({ left: direction * (step + gap), behavior: "smooth" });
		}

		[prev, next].forEach(function (button) {
			if (!button) return;
			button.addEventListener("click", function () {
				page(Number(button.getAttribute("data-elcorix-slider-step")));
			});
		});

		track.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule, { passive: true });
		sync();
	}

	/* ------------------------------------------------------------------ */
	/* Full-screen image viewer                                            */
	/* ------------------------------------------------------------------ */

	/*
	 * One viewer for the whole document, shared by the works slider and the
	 * gallery grid. While it is open it locks page scrolling, moves focus
	 * into the dialog and returns it to the tile on close, and handles
	 * Escape and the arrow keys. Paging wraps, so neither arrow is a dead
	 * end.
	 */
	function initLightbox() {
		var dialog = document.querySelector("[data-elcorix-lightbox]");
		if (!dialog) return;

		var image = dialog.querySelector("[data-elcorix-lightbox-image]");
		var source = dialog.querySelector("[data-elcorix-lightbox-source]");
		var caption = dialog.querySelector("[data-elcorix-lightbox-caption]");
		var counter = dialog.querySelector("[data-elcorix-lightbox-counter]");
		var steps = dialog.querySelectorAll("[data-elcorix-lightbox-step]");

		var tiles = [];
		var index = null;
		var previouslyFocused = null;
		var previousOverflow = "";

		function show(position) {
			var tile = tiles[position];
			if (!tile) return;
			index = position;

			var tileImage = tile.querySelector("img");
			var tileSource = tile.querySelector("source");
			var alt = tile.getAttribute("data-elcorix-gallery-alt") || "";

			if (image && tileImage) {
				image.src = tileImage.getAttribute("src") || "";
				image.alt = alt;
				image.removeAttribute("srcset");
			}
			if (source) {
				// Full width here, so the tile's own `sizes` would be wrong.
				source.srcset = tileSource ? tileSource.getAttribute("srcset") || "" : "";
				source.removeAttribute("sizes");
			}
			if (caption) caption.textContent = alt;
			if (counter) {
				counter.hidden = tiles.length <= 1;
				counter.textContent = (strings.lightboxCounter || "%1$d of %2$d")
					.replace("%1$d", String(position + 1))
					.replace("%2$d", String(tiles.length));
			}
			steps.forEach(function (button) {
				button.hidden = tiles.length <= 1;
			});
		}

		function open(group, position) {
			tiles = Array.prototype.slice.call(
				document.querySelectorAll(
					'[data-elcorix-gallery="' + group + '"] [data-elcorix-gallery-item]'
				)
			);
			if (!tiles.length) return;

			previouslyFocused = document.activeElement;
			previousOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			dialog.hidden = false;
			show(position);
			dialog.focus();
		}

		function close() {
			dialog.hidden = true;
			index = null;
			document.body.style.overflow = previousOverflow;
			if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
		}

		function step(direction) {
			if (index === null || tiles.length === 0) return;
			show((index + direction + tiles.length) % tiles.length);
		}

		document
			.querySelectorAll("[data-elcorix-gallery] [data-elcorix-gallery-item]")
			.forEach(function (tile) {
				tile.addEventListener("click", function () {
					var group = tile.closest("[data-elcorix-gallery]");
					open(
						group ? group.getAttribute("data-elcorix-gallery") : "",
						Number(tile.getAttribute("data-elcorix-gallery-item"))
					);
				});
			});

		steps.forEach(function (button) {
			button.addEventListener("click", function () {
				step(Number(button.getAttribute("data-elcorix-lightbox-step")));
			});
		});

		var closeButton = dialog.querySelector("[data-elcorix-lightbox-close]");
		if (closeButton) closeButton.addEventListener("click", close);

		// Only a click on the backdrop itself closes the viewer.
		dialog.addEventListener("click", function (event) {
			if (event.target === dialog) close();
		});

		document.addEventListener("keydown", function (event) {
			if (dialog.hidden) return;
			if (event.key === "Escape") {
				event.preventDefault();
				close();
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				step(-1);
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				step(1);
			}
		});
	}

	/* ------------------------------------------------------------------ */
	/* Forms                                                               */
	/* ------------------------------------------------------------------ */

	/*
	 * Phone-number check, kept identical to the server's
	 * elcorix_is_valid_phone: loose about formatting, strict about content.
	 * The server repeats it — this copy only exists so the visitor is told
	 * before the round trip.
	 */
	function isValidPhone(value) {
		var trimmed = String(value || "").trim();
		if (trimmed === "" || trimmed.length > 50) return false;
		if (!/^\+?[\d\s()./-]+$/.test(trimmed)) return false;
		var digits = trimmed.replace(/\D/g, "");
		return digits.length >= 7 && digits.length <= 15;
	}

	/** Today in the visitor's own time zone, as YYYY-MM-DD. */
	function today() {
		var now = new Date();
		var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
		return local.toISOString().slice(0, 10);
	}

	function setError(form, name, message) {
		var element = form.querySelector('[data-elcorix-error="' + name + '"]');
		if (!element) return;
		element.textContent = message || "";
		element.hidden = !message;
	}

	function setStatus(form, which) {
		form.querySelectorAll("[data-elcorix-status]").forEach(function (element) {
			element.hidden = element.getAttribute("data-elcorix-status") !== which;
		});
	}

	function initForms() {
		document.querySelectorAll("[data-elcorix-form]").forEach(function (form) {
			var kind = form.getAttribute("data-elcorix-form");
			var button = form.querySelector("[data-elcorix-submit]");

			form.addEventListener("submit", function (event) {
				event.preventDefault();
				var fields = new FormData(form);
				var payload;

				if (kind === "booking") {
					var phone = String(fields.get("customerPhone") || "");
					if (!isValidPhone(phone)) {
						// Keep the browser's own bubble out of it: the message
						// belongs in the form, in the visitor's language.
						setError(form, "phone", strings.phoneError);
						var phoneField = form.querySelector("#consult-phone");
						if (phoneField) phoneField.focus();
						return;
					}
					setError(form, "phone", "");

					var date = String(fields.get("date") || "").trim();
					var time = String(fields.get("time") || "").trim();
					// A time on its own is not a slot anyone can act on —
					// "14:00" tells staff nothing about the day — and the server
					// rejects it. Ask for the date instead of silently dropping
					// what the visitor chose.
					if (date === "" && time !== "") {
						setError(form, "date", strings.dateRequired);
						var dateField = form.querySelector("#consult-date");
						if (dateField) dateField.focus();
						return;
					}
					if (date !== "" && date < today()) {
						setError(form, "date", strings.datePast);
						var pastField = form.querySelector("#consult-date");
						if (pastField) pastField.focus();
						return;
					}
					setError(form, "date", "");

					payload = {
						customerName: fields.get("customerName"),
						customerPhone: phone,
						preferredAt: date === "" ? "" : [date, time].filter(Boolean).join(" "),
						marketingConsent: fields.get("marketingConsent") === "on",
						// Honeypot: hidden from humans, bots fill it in.
						website: fields.get("website"),
					};
				} else {
					payload = {
						name: fields.get("name"),
						email: fields.get("email"),
						message: fields.get("message"),
						// Language of the auto-reply confirmation e-mail.
						lang: data.language,
						website: fields.get("website"),
					};
				}

				setStatus(form, null);
				if (button) {
					button.disabled = true;
					button.textContent =
						button.getAttribute("data-sending-label") || strings.sending || "";
				}

				fetch(data.restUrl + (kind === "booking" ? "bookings" : "contact"), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				})
					.then(function (response) {
						if (!response.ok) throw new Error("HTTP " + response.status);
						form.reset();
						setStatus(form, "sent");
					})
					.catch(function () {
						setStatus(form, "error");
					})
					.finally(function () {
						if (!button) return;
						button.disabled = false;
						button.textContent = button.getAttribute("data-label") || "";
					});
			});
		});
	}

	/* ------------------------------------------------------------------ */

	function boot() {
		initHeader();
		initMenu();
		initLanguageSwitcher();
		initReveals();
		initConsent();
		initSlider();
		initLightbox();
		initForms();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})();
