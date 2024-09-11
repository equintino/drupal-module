# Booklet

Booklet is a module inspired by Leaflet adapted for navigation on the map of Portugal showing its districts, municipalities and freguesias.


## Installation

The Geofield module needs to be installed

__$ composer require drupal/geofield__


## Configuration

Once enabled the module it will be possible to add a "Geofield" field type to
any entity type/bundle and then choose the preferred widget or formatter.


## Step to stap
Creating a Content Type
in structure -> content type -> add content type
_ Fill in the name, example "Map" or whatever you want
_ Publishing Options only leaves "Published" marked
_ Save

### Manage field
_ add field
   + Geofield
   + label "Map" or whatever you want
_ Save

_Field setting
   + Save

### ManageDisplay
_ In the created field
  + label = Hidden
  + Booklet Map
_ Save

### Creating content
_ Add content
   + Select the created content type ("Map")
   + Give a title
   + Menu setting
      + Check (Provide a menu link)
   + URL alias
      /maps
_ Save

*The created page will display the map
