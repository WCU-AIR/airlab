---
title: Team
nav:
  order: 4
  tooltip: About our team
---

# {% include icon.html icon="fa-solid fa-users" %}Team

{% include section.html %}

{% include list.html data="members" component="portrait" filter="role == 'pi' || role == 'co-director'" %}

{% include section.html background="images/background.jpg" dark=true %}

<blockquote class="quote-frame">
  <p class="quote-attribution"><strong>Henry Ford</strong></p>
  <p><em>Coming together is a beginning; keeping together is progress; working together is success.</em></p>
</blockquote>

<blockquote class="quote-frame">
  <p class="quote-attribution"><strong>Francis Crick</strong></p>
  <p><em>The structure of DNA was discovered not by one mind, but many minds working together.</em></p>
</blockquote>

{% include section.html %}

{% capture content %}

{% include list.html data="members" component="portrait" filter="role != 'pi' && role != 'co-director' && former != true" %}

{% endcapture %}

{% include grid.html style="square" content=content %}

{% include section.html %}

## {% include icon.html icon="fa-solid fa-user-clock" %} Lab Alumni

{% capture content %}

{% include list.html data="members" component="portrait" filter="former == true" %}

{% endcapture %}

{% include grid.html style="square" content=content %}
