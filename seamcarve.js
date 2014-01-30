
var Canvas = document.getElementById("original") ;
var GrayCanvas = document.getElementById("grayscale") ;
var GradCanvas = document.getElementById("gradientMagnitude") ;
var CarveCanvas = document.getElementById("carved") ;

var Context = Canvas.getContext("2d") ;
var GrayContext = GrayCanvas.getContext("2d") ;
var GradContext = GradCanvas.getContext("2d") ;
var CarveContext = CarveCanvas.getContext("2d") ;

var ImageData = null ;
var GrayImageData = null ;
var GradImageData = null ;
var CarveImageData = null ;

var CostMatrix ;
var ParentsMatrix ;

var VerticalSeam ;

var Width = -1 ;
var Height = -1 ;


// Boolean indicators for how far 
// the algorithm has progressed:
var FoundGrayscale ;
var FoundGradient ;
var FoundSeam ;
var FoundCarved ;

var IterationsBox = document.getElementById("iterations") ;



// Use gradient magnitude for cost/energy:
function Energy(x,y) {
  return GetGradPixel(x,y) ;
}


// Load the image:
var Image = new Image() ;
Image.src = "tower.jpg" ;


Image.onload = function () {

  Canvas.width = this.width ;
  Canvas.height = this.height ;

  Context.drawImage(Image, 0, 0, this.width, this.height) ;

  Init() ;

} ;


function Init() {
  FoundGrayscale = false ;
  FoundGradient = false ;
  FoundSeam = false ;
  FoundCarved = false ;

  Width = Canvas.width ;
  Height = Canvas.height ;

  /* Set up Grayscale canvas */
  GrayCanvas.width = Width ;
  GrayCanvas.height = Height ;

  GrayContext.fillRect(0,0,Width,Height) ;

  /* Set up Gradient Magnitude canvas */
  GradCanvas.width = Width ;
  GradCanvas.height = Height ;

  GradContext.fillRect(0,0,Width,Height) ;


  /* Set up the carve canvas */
  CarveCanvas.width = Width - 1 ;
  CarveCanvas.height = Height ;
 
  CarveContext.fillRect(0,0,Width-1,Height) ;
}




/* Procedures for interacting with the buffers. */

function FetchImageData() {
  ImageData = Context.getImageData(0,0,Canvas.width,Canvas.height) ;
}

function PushImageData() {
  Context.putImageData(ImageData,0,0) ;
}


function FetchGrayImageData() {
  GrayImageData = GrayContext.getImageData(0,0,
                   GrayCanvas.width,GrayCanvas.height) ;
}

function PushGrayImageData() {
  GrayContext.putImageData(GrayImageData,0,0) ;
}


function FetchGradImageData() {
  GradImageData = GradContext.getImageData(0,0,
                   GradCanvas.width,GradCanvas.height) ;
}

function PushGradImageData() {
  GradContext.putImageData(GradImageData,0,0) ;
}

function FetchCarveImageData() {
  CarveImageData = CarveContext.getImageData(0,0,
                   CarveCanvas.width,CarveCanvas.height) ;
}

function PushCarveImageData() {
  CarveContext.putImageData(CarveImageData,0,0) ;
}





function InitializeSeamMatrices () {

  CostMatrix = [] ;
  ParentsMatrix = [] ;

  for (var x = 0; x < Width; ++x)  {

    CostMatrix[x] = [] ;  
    ParentsMatrix[x] = [] ;

    for (var y = 0; y < Height; ++y) {
      CostMatrix[x][y] = 0 ;
      ParentsMatrix[x][y] = [] ;
    }
  }
}


function GetPixel(x,y) {
  var index = (y * Width + x) * 4 ;
  var pixel = {} ;
  pixel.red = ImageData.data[index] ;
  pixel.green = ImageData.data[index+1] ;
  pixel.blue = ImageData.data[index+2] ;
  pixel.alpha = ImageData.data[index+3] ;
  return pixel ;
}


function SetPixel(x,y, red,green,blue,alpha) {
  if (typeof green == "undefined") {
    // Assume red is an object.
    var pixel = red ;
    red = pixel.red ;
    green = pixel.green ;
    blue = pixel.blue ;
    alpha = pixel.alpha ;
  }
  if (typeof alpha == "undefined") alpha = 255 ;
  var index = (y * Width + x) * 4 ;
  ImageData.data[index] = red ;
  ImageData.data[index+1] = green ;
  ImageData.data[index+2] = blue ;
  ImageData.data[index+3] = alpha ;
}


function GetCarvePixel(x,y) {
  var index = (y * Width + x) * 4 ;
  var pixel = {} ;
  pixel.red = CarveImageData.data[index] ;
  pixel.green = CarveImageData.data[index+1] ;
  pixel.blue = CarveImageData.data[index+2] ;
  pixel.alpha = CarveImageData.data[index+3] ;
  return pixel ;
}


function SetCarvePixel(x,y, red,green,blue,alpha) {
  if (typeof green == "undefined") {
    // Assume red is an object.
    var pixel = red ;
    red = pixel.red ;
    green = pixel.green ;
    blue = pixel.blue ;
    alpha = pixel.alpha ;
  }

  if (typeof alpha == "undefined") alpha = 255 ;
  var index = (y * (Width-1) + x) * 4 ;
  CarveImageData.data[index] = red ;
  CarveImageData.data[index+1] = green ;
  CarveImageData.data[index+2] = blue ;
  CarveImageData.data[index+3] = alpha ;
}





function GetGrayPixel(x,y) {
  var index = (y * Width + x) * 4 ;
  return GrayImageData.data[index] ;
}

function SetGrayPixel(x,y,value) {
  var index = (y * Width + x) * 4 ;
  GrayImageData.data[index] = value; 
  GrayImageData.data[index+1] = value;  
  GrayImageData.data[index+2] = value; 
}


function GetGradPixel(x,y) {
  var index = (y * Width + x) * 4 ;
  return GradImageData.data[index] ;
}

function SetGradPixel(x,y,value) {
  var index = (y * Width + x) * 4 ;
  GradImageData.data[index] = value; 
  GradImageData.data[index+1] = value;  
  GradImageData.data[index+2] = value; 
}





function ConvertToAverageGrayscale() {

  FetchImageData() ; 
  FetchGrayImageData() ;

  for (var x = 0; x < Width; ++x) 
    for (var y = 0; y < Height; ++y) {
      var pixel = GetPixel(x,y) ;
      var average = (pixel.red + pixel.blue + pixel.green) / 3 ;
      SetGrayPixel(x,y, average) ;
    }

  PushGrayImageData() ;

  FoundGrayscale = true ;
}





function ComputeGradientMagnitude() {

  if (!FoundGrayscale) ConvertToAverageGrayscale() ;

  FetchGrayImageData() ;
  FetchGradImageData() ;

  for (var x = 0; x < Width; ++x) 
    for (var y = 0; y < Height; ++y) {
      var here = GetGrayPixel(x,y) ;

      // Get the gray value to the left, but set to 
      // current value if at the left edge of the picture:
      var left = (x > 0) ? GetGrayPixel(x-1,y) : here ;

      // Get the gray value above, but set to the center
      // current value if at the top edge of the picture:
      var above = (y > 0) ? GetGrayPixel(x,y-1) : here ;

      var dx = left  - here ;
      var dy = above - here ;

      var mag = Math.sqrt(dx*dx + dy*dy) ;

      SetGradPixel(x,y, mag * 255 / 361) ;
    }

  PushGradImageData() ;

  FoundGradient = true ;
}


function Parents(x,y) {

  function Parent(x,y) {
    this.x = x ;
    this.y = y ;
    this.cost = CostMatrix[x][y];
  }

  if (y == 0) {

    // Top row:
    return [] ;
  
  } else if (x == 0) {

    // Left edge:
    var Up = new Parent(x,y-1) ; 
    var UpRight = new Parent(x+1,y-1) ;
    return [UpRight,Up] ;
       
  } else if (x == (Width-1)) {
  
    // Right edge:
    var Up = new Parent(x,y-1) ; 
    var UpLeft = new Parent(x-1,y-1) ;
    return [UpLeft,Up] ;

  } else {

    // Middle:
    var Up = new Parent(x,y-1) ; 
    var UpLeft = new Parent(x-1,y-1) ;
    var UpRight = new Parent(x+1,y-1) ;
    return [UpLeft,UpRight,Up] ;

  }

}

function ComputeVerticalSeams(energy) {
  // energy(x,y) is the energy/cost of a pixel

  if (!FoundGradient) ComputeGradientMagnitude() ;

  InitializeSeamMatrices() ;

  // Go row by row:
  for (var y = 0; y < Height; ++y) {

    // Then go column by column:
    for (var x = 0; x <  Width; ++x) {
 
      // Set the top row equal to its energy:
      if (y == 0) {
        CostMatrix[x][y] = energy(x,y) ;
        continue ;
      }
 
      // Find the parents of the current pixel:
      var parents = Parents(x,y) ;

      // Find the parent(s) with the lowest cost:
      var min_cost = parents[0].cost ;

      for (var i = 0; i < parents.length; ++i) {
        var cost = parents[i].cost ;
        min_cost = (cost < min_cost) ? cost : min_cost ;
      }

      // Record the minimum cost of this pixel:
      CostMatrix[x][y] = min_cost + energy(x,y) ;

      // Record the minimum cost parent(s) of this pixel:
      for (var i = 0; i < parents.length; ++i) {
        var cost = parents[i].cost ;
        if (min_cost == parents[i].cost)
          ParentsMatrix[x][y].push(parents[i]) ;
      }

    }
  }

  // Now, scan the bottom row for the pixels with lowest cost:
  var y_bot = Height-1 ;

  var min_cost = CostMatrix[0][y_bot] ;

  var min_x = 0 ;

  for (var x = 0; x < Width; ++x) {
    var cost = CostMatrix[x][y_bot] ;
    if (cost < min_cost) {
      min_cost = cost ;
      min_x = x ;
    }
  }

  // console.log(min_x) ;
  // console.log(min_cost) ;

  TraceVerticalSeam(min_x) ;

  FoundSeam = true ;
}


function TraceVerticalSeam(x, r,g,b) {

  VerticalSeam = [] ;

  var y = Height-1 ;

  var parent = null ;

  while (y > 0) {

    SetPixel(x,y, 255,0,0,255)

    VerticalSeam[y] = x ;

    parents = ParentsMatrix[x][y] ;

    if (parents != [])
      parent = parents[0] ;
    else {
      break ;
    }

    x = parent.x ;
    y = parent.y ;

  } ;

  VerticalSeam[y] = x ;

  PushImageData() ;
}


function ComputeVerticalCarve() {

  if (!FoundSeam) ComputeVerticalSeams(Energy) ;

  FetchCarveImageData() ;  

  for (var y = 0; y < Height; ++y) {
    var seam_x = VerticalSeam[y] ;

    for (var x = 0; x < Width-1; ++x) {

      // Skip over the carved pixel on this row:
      if (x < seam_x)
        SetCarvePixel(x,y, GetPixel(x,y)) ;
      else 
        SetCarvePixel(x,y, GetPixel(x+1,y)) ;

    }
  }

  PushCarveImageData() ;

  FoundCarved = true ;

}


function SwapImages() {
  if (!FoundCarved) ComputeVerticalCarve() ;

  Canvas.width = CarveCanvas.width ;
  Canvas.height = CarveCanvas.height ;

  Context.putImageData(CarveImageData, 0, 0) ;

  Init() ;
}


// Input Handlers

function HandleGrayscale() {
  ConvertToAverageGrayscale() ;
}

function HandleGradient() {
  ComputeGradientMagnitude() ;
}

function HandleFindSeam() {
  ComputeVerticalSeams(Energy) ;
}

function HandleCarve() {
  ComputeVerticalCarve() ;
}

function HandleSwap() {
  if (IterationsBox.value > 0) {
    IterationsBox.value-- ;

    SwapImages() ;

    setTimeout(HandleSwap,0) ;
  }
}
