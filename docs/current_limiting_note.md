# PCA9685 and LED current limiting

The PCA9685 is a PWM controller, not a constant-current LED driver.

For bare LEDs, use current-limiting resistors, transistor/MOSFET stages with resistors,
or a constant-current driver. PWM reduces average brightness but does not safely limit
instantaneous LED current.
