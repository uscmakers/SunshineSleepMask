// Adafruit_DotStarMatrix example for single DotStar LED matrix.
// Scrolls 'Howdy' across the matrix.
// make sure to download all necessary libraries for this!!!
// useful for audio shi: https://github.com/pschatzmann/ESP32-A2DP/
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_DotStarMatrix.h>
#include <Adafruit_DotStar.h>
//------------------------ added
#include "AudioTools.h"
#include "BluetoothA2DPSink.h"
//------------------------ added end

#ifndef PSTR
 #define PSTR // Make Arduino Due happy
#endif

#define DATAPIN  4
#define CLOCKPIN 5

// MATRIX DECLARATION:
// Parameter 1 = width of DotStar matrix
// Parameter 2 = height of matrix
// Parameter 3 = pin number (most are valid)
// Parameter 4 = matrix layout flags, add together as needed:
//   DS_MATRIX_TOP, DS_MATRIX_BOTTOM, DS_MATRIX_LEFT, DS_MATRIX_RIGHT:
//     Position of the FIRST LED in the matrix; pick two, e.g.
//     DS_MATRIX_TOP + DS_MATRIX_LEFT for the top-left corner.
//   DS_MATRIX_ROWS, DS_MATRIX_COLUMNS: LEDs are arranged in horizontal
//     rows or in vertical columns, respectively; pick one or the other.
//   DS_MATRIX_PROGRESSIVE, DS_MATRIX_ZIGZAG: all rows/columns proceed
//     in the same order, or alternate lines reverse direction; pick one.
//   See example below for these values in action.
// Parameter 5 = pixel type:
//   DOTSTAR_BRG  Pixels are wired for BRG bitstream (most DotStar items)
//   DOTSTAR_GBR  Pixels are wired for GBR bitstream (some older DotStars)

Adafruit_DotStarMatrix matrix = Adafruit_DotStarMatrix(
  16, 8, DATAPIN, CLOCKPIN,
  DS_MATRIX_TOP     + DS_MATRIX_RIGHT +
  DS_MATRIX_COLUMNS + DS_MATRIX_PROGRESSIVE,
  DOTSTAR_BRG);
//Adafruit_DotStarMatrix matrix = Adafruit_DotStarMatrix(
//  8, 8,
//  DS_MATRIX_TOP     + DS_MATRIX_RIGHT +
//  DS_MATRIX_COLUMNS + DS_MATRIX_PROGRESSIVE,
//  DOTSTAR_BRG);

//------------------- added

I2SStream i2s;
BluetoothA2DPSink a2dp_sink(i2s);
// -------------------- added end


const uint16_t colors[] = {
  matrix.Color(255, 0, 0), matrix.Color(0, 255, 0), matrix.Color(0, 0, 255) };

void setup() {
  matrix.begin();
  matrix.setTextWrap(false);
  matrix.setBrightness(40);
  matrix.setTextColor(colors[0]);

  //-------------- added
  auto cfg = i2s.defaultConfig();
    cfg.pin_bck = 26;
    cfg.pin_ws = 25;
    cfg.pin_data = 27;
    i2s.begin(cfg);

    a2dp_sink.start("MyMusic");
  // ----------------- added
}

int x    = matrix.width();
int pass = 0;

void loop() {
  matrix.fillScreen(0);
  matrix.setCursor(x, 0);
  matrix.print(F("Howdy"));
  if(--x < -72) {
    x = matrix.width();
    if(++pass >= 3) pass = 0;
    matrix.setTextColor(colors[pass]);
  }
  matrix.show();
  delay(100);
}
