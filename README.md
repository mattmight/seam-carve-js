Seam Carving in JavaScript
==========================

[Seam carving] is a technique for resizing an image while intelligently
preserving "important" content such as people or structures.

[Shai Avidan] and [Ariel Shamir] published a [SIGGRAPH 2007] paper 
describing the algorithm.

When an image needs to contract, the algorithm finds a connected "seam" in the
image running edge to edge along a "path of least importance."

Importance is determined by an energy function that assigns a cost to each
pixel.

The code illustrates exposes phase of the algorithm as a separate image:

 1. Conversion to grayscale.
 2. Computation of the gradient magnitude.
 3. Finding the minimal seam.
 4. Carving out the seam.

It makes extensive use of the HTML5 canvas element.

The code is not geared toward efficiency, but rather, human readability.

My goal was to make the algorithm itself as clear as possible.

The [tower image] is from Wikipedia.


[Seam carving]:  http://en.wikipedia.org/wiki/Seam_carving

[Shai Avidan]:   http://www.eng.tau.ac.il/~avidan/

[Ariel Shamir]:  http://www.faculty.idc.ac.il/arik/

[SIGGRAPH 2007]: http://www.faculty.idc.ac.il/arik/SCWeb/imret/imret.pdf

[tower image]:   http://en.wikipedia.org/wiki/File:Broadway_tower_edit.jpg
