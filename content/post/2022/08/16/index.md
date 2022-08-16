---
title:  "ACF to REST API update options pages"
categories:
    - snippets
date: 2022-08-16
---

# ACF to REST API

Available here: https://github.com/airesvsg/acf-to-rest-api

Exposes ACF endpoints that would be otherwise missing.

## Get values from options pages

`GET https://example.com/wp-json/acf/v3/options/page_settings/`

where `page_settings` identifies the options page in question.

Returns:

```json
{
   "acf":{
      "address":"Address",
      "social_fb":"https:\/\/www.facebook.com\/example\/",
      "social_instagram":"",
      "social_twitter":"",
      "social_youtube":"https:\/\/www.youtube.com\/example"
   }
}
```

## To update values

`POST https://example.com/wp-json/acf/v3/options/page_settings/`

```json
{
   "fields":{
      "address":"Address",
      "social_fb":"https:\/\/www.facebook.com\/example\/",
      "social_instagram":"",
      "social_twitter":"",
      "social_youtube":"https:\/\/www.youtube.com\/example"
   }
}
```

**Attention:** The json key is actually "fields" here, not the "acf" that is returned with the `GET` call. 🤷‍♂️

### Doesn't work, returns error 500!

Add this to your functions.php, as stated in https://github.com/airesvsg/acf-to-rest-api/issues/56

```php
add_filter( 'acf/location/rule_match/options_page', function( $visibility ) {
    if ( ! is_admin() ) {
        return true;
    }

    return $visibility;
} );
```
