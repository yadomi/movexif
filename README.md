# movexif

CLI tool to move or copy pictures based on an EXIF pattern.

## Usage

`Usage: index.js <source> <dest> [OPTIONS]`

Example:

`node index.js /Volume/SDCARD/ /home/myuser/Pictures/ --dry-run -p "<Make>/<Model>/d(yyyy)/d(yyyy-MM-dd_H-mm-ss)"`

## CLI Options

### `-p <pattern>`

A pattern used to determine how to move files in <dest>. See [Pattern details](#pattern-details) for more details.

### `--copy`

Copy files instead of moving them.

### `--overwrite`

Overwrite files if destination is not empty, ignored otherwise.

### `--dry-run`

Dry run, show what's gonna happen but don't copy or move the files.

## Pattern details

A pattern is a string that represent the new path for the file being moved or copied.

- The pattern can contain any EXIF metadata
- Any date format (based on Unicode Technical Standard #35: https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table)

### Exif metadata

Here is the list of all metadata that can be used in a pattern:

- `Make`
- `Model`
- `Orientation`
- `XResolution`
- `YResolution`
- `ResolutionUnit`
- `Software`
- `ExposureTime`
- `FNumber`
- `ExposureProgram`
- `ISO`
- `ShutterSpeedValue`
- `ApertureValue`
- `ExposureBiasValue`
- `MaxApertureValue`
- `MeteringMode`
- `Flash`
- `FocalLength`
- `ColorSpace`
- `PixelXDimension`
- `PixelYDimension`
- `FocalPlaneXResolution`
- `FocalPlaneYResolution`
- `FocalPlaneResolutionUnit`
- `CustomRendered`
- `ExposureMode`
- `WhiteBalance`
- `SceneCaptureType`

To use in a pattern, wrap the name in <>.
Example: `<Make>/<Model>`

### Date

To use a date in a pattern, use the `d(format)` syntax, where format is any valid format from https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table

Example `d(yyyy)/d(MM)/d(dd)/`

### File name

- If the pattern ends with a slash, a folder matching the last part of the pattern will be created and **files will be moved without touching the initial file name**
- If the pattern does not end with a slash, the file will be renamed with the matching pattern.

## Examples

This folder structure can be created with the pattern:

`d(yyyy)/d(MMMM)/d(dd)/`

This will sort by year, month then day without altering original file name

```
  .
├── 2020/
│   ├── January/
│   │   ├── 1/
│   │   │   ├── IMG_2002.jpg
│   │   │   └── IMG_2003.jpg
│   │   └── 2/
│   │       └── IMG_2004.jpg
│   └── Febuary/
│       └── 10/
│           └── IMG_3004.jpg
└── 2021/
    └── January/
        └── ...
```

---

This folder structure can be created with the pattern:

`d(yyyy)/d(yyyy-MM)/d(yyyy-MM-dd)/d(yyyy-MM-dd_H-mm-ss)`

This will sort by year, year and month number then full date.
Note that this pattern does not ends with a slash and files has been renamed.

```
.
├── 2020
├── 2020-01/
│   └── 2020-01-01/
│       ├── 2020-01-01_19-50-35.jpg
│       └── 2020-01-01_19-51-46.jpg
├── 2020-12/
│   ├── 2020-12-24/
│   │   └── 2020-12-24_10-02-15.jpg
│   └── 2020-12-25/
│       └── ...
└── 2021  /
    └── 2021-01/
        └── ...
```

---

This folder structure can be created with the pattern:

`<Make>/<Model>/d(yyyy)/d(yyyy-MM-dd_H-mm-ss)`

This will sort by Brand then model then by datetime

```
  .
├── Panasonic/
│   ├── GH5/
│   │   ├── 2020-03-05_20-41-41.jpg
│   │   └── 2020-03-06_20-40-42.jpg
│   └── GX85/
│       ├── 2020-03-05_20-41-48.jpg
│       └── 2020-03-06_20-40-50.jpg
└── Canon/
    ├── EOS-RP/
    │   └── 2020-03-06_20-41-23.jpg
    └── R6/
        └── ...
```
