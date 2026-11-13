#include "USB.h"
#include "USBHIDKeyboard.h"
USBHIDKeyboard Keyboard;

const uint8_t PINOS[6]  = {7, 6, 5, 4, 3, 2};   // BT1..BT6
const uint8_t TECLAS[6] = {
  KEY_UP_ARROW,     // BT1 cima
  KEY_LEFT_ARROW,   // BT2 esquerda
  KEY_RIGHT_ARROW,  // BT3 direita
  KEY_DOWN_ARROW,   // BT4 baixo
  'a',              // BT5 cancelar / apagar
  ' '               // BT6 confirmar / executar
};

void setup() {
  for (int i = 0; i < 6; i++) pinMode(PINOS[i], INPUT_PULLUP);

  // Buzzer (IO17) mantido desligado: sem isso ele apitava ao ligar.
  pinMode(17, OUTPUT);
  digitalWrite(17, LOW);

  Keyboard.begin();
  USB.begin();
}

void loop() {
  for (int i = 0; i < 6; i++) {
    if (digitalRead(PINOS[i]) == LOW) {                 // botao apertado
      Keyboard.press(TECLAS[i]);
      delay(50);
      Keyboard.release(TECLAS[i]);
      while (digitalRead(PINOS[i]) == LOW) delay(10);   // espera soltar (sem repetir)
      delay(30);                                        // evita repique ao soltar
    }
  }
}
