<?php
/**
 * The one-page landing layout from the Figma.
 *
 * The section order is the Figma's: hero → Für wen ist es geeignet? →
 * Moderne Diodenlaser-Technologie → Ihre Haut in erfahrenen Händen →
 * Sehen Sie sich unsere Arbeiten an → Beliebte Leistungen und Preise →
 * Termin vereinbaren (Altegio) → Kostenlose Beratung anfordern → Kontakt.
 *
 * The same sections are also reachable as their own pages (/prices,
 * /gallery, /booking, /contact) — those templates include these same
 * parts rather than duplicating the markup.
 *
 * @package Elcorix
 */

get_header();

foreach ( array( 'hero', 'for-whom', 'technology', 'specialist', 'work', 'prices', 'booking', 'consultation', 'contact' ) as $elcorix_section ) {
	get_template_part( 'template-parts/sections/' . $elcorix_section );
}

get_footer();
