news_articles.sort(function (a, b) {
  return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0)
});

LinkReplacer = function(content) {
  this.content = content;
}

LinkReplacer.prototype.replaceLink = function(text) {
  var link = $("a:contains('" + text + "')", this.content);
  if (!link.size()) {
    return;
  }
  if (!this.buttonGroup) {
    this.buttonGroup = $('<div class="btn-group pull-right"></div>').appendTo(this.content);
    $('<div class="clearfix"></div>').appendTo(this.content);
  }
  var button = $('<button class="btn btn-inverse"></button>').appendTo(this.buttonGroup);
  button.html(link.html());
  button.click(link.attr("href"), function(ev) {location.href = ev.data});
  $("a:contains('" + text + "') + br", this.content).each(function(index, br) {$(br).remove()});
  link.remove();
}

function build_news_article(article, element, data) {
  var loaded = $('#news-article', data);

  var header = $('h1', loaded);
  header.detach();
  var newHeader = $('<h2><small>' + article.date + '</small> ' + '</h2>');
  var link = $('<a></a>');
  link.attr("href", root_path + 'news/' + article.file);
  link.append(header.html());
  newHeader.append(link);

  var linkReplacer = new LinkReplacer(loaded);
  linkReplacer.replaceLink('Release notes');
  linkReplacer.replaceLink('Download');

  loaded.removeAttr('id');
  loaded.attr('class', 'news-content');

  element.append(newHeader);
  element.append(loaded);
}

NewsPager = function(feed, size, upper) {
  var pager = $('<ul class="pager"></ul>');
  if (upper) {
    pager = pager.prependTo(feed);
  } else {
    pager = pager.appendTo(feed);
  }
  this.feed = feed;
  this.size = size;
  this.older = $('<li class="previous disabled"></li>').appendTo(pager);
  this.olderLink = $('<a href="#">&larr; Older</a>').appendTo(this.older);
  this.newer = $('<li class="next disabled"></li>').appendTo(pager);
  this.newerLink = $('<a href="#">Newer &rarr;</a>').appendTo(this.newer);
}

NewsPager.prototype.setFirst = function(first) {
  if (isNaN(first) || first <= 0) {
    first = 0;
  }

  if (first == 0) {
    this.newer.addClass("disabled");
    this.newerLink.off("click");
  } else {
    this.newer.removeClass("disabled");
    var newerStart = first - this.size;
    if (newerStart < 0) {
      newerStart = 0;
    }
    this.newerLink.on(
      "click",
      {feed: this.feed, start: newerStart},
      function(ev) {load_news_feed(ev.data.feed, ev.data.start)});
  }

  var olderStart = first + this.size;
  if (olderStart >= news_articles.length) {
    this.older.addClass("disabled");
    this.olderLink.off("click");
  } else {
    this.older.removeClass("disabled");
    this.olderLink.on(
      "click",
      {feed: this.feed, start: olderStart},
      function(ev) {load_news_feed(ev.data.feed, ev.data.start)});
  }
}


function load_news_feed(feed, first) {
  var size = parseInt(feed.attr('feed-size'));
  if (isNaN(size) || size <= 0) {
    size = 3;
  } else if (size > news_articles.length) {
    size = news_articles.length;
  }
  feed.empty();
  if (isNaN(first) || first < 0) {
    first = 0;
  }
  var last = first + size;
  if (last > news_articles.length) {
    last = news_articles.length;
  }
  for (var i = first; i < last; ++i) {
    var article = news_articles[i];
    var element =
      $('<article class="news-article"></article>').appendTo(feed);
    var handler = (function(article, element) {
      return function(data) {
        build_news_article(article, element, data)
      };
    })(article, element);
    $.get(
      root_path + 'news/' + article.file,
      handler,
      "text");
  }
  if (feed.attr('id') == "news-archive") {
    (new NewsPager(feed, size, true)).setFirst(first);
    (new NewsPager(feed, size, false)).setFirst(first);
  }
}

$(document).ready(function() {
  $('.news-feed').each(function(index, feed) {
    load_news_feed($(feed), 0);
  })
});
