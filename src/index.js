const div = document.querySelector('.div')
ymaps.ready(init);
function init(){
    points = JSON.parse(localStorage.getItem('marks')) || [];
    const clasterContentLayout = ymaps.templateLayoutFactory.createClass(`
            <div class="cluster__link"><a class="search_by_address">{{ properties.address|raw }}</a></div>
            <div class="">{{ properties.name }}</div>
            <div class="search_by_coords" style="display: none">{{ properties.coords }}</div>
            <div class="">{{ properties.text }}</div>`
        , {
            build:function () {
                balloonLayout.superclass.build.call(this);
                const selectPoint = document.querySelector('.search_by_address');
                const coords = document.querySelector('.search_by_coords');

                selectPoint.addEventListener('click', async e => {
                    e.preventDefault();
                    const data = JSON.parse(localStorage.getItem('marks'));
                    const reviews = [];

                    for (const item of data) {
                        if (item.coords == coords.textContent) {
                            reviews.push({
                                date: item.date,
                                place: item.place,
                                name: item.name,
                                text: item.text
                            })
                        }
                    }
                    myMap.balloon.open(coords.textContent.split(','), {
                        properties: {
                            address: selectPoint.textContent,
                            flag: "flag",
                            coords: coords.textContent,
                            reviews:reviews
                        }
                    });
                })
            },
        });

    const clusterer = new ymaps.Clusterer({
        preset: 'islands#invertedVioletClusterIcons',
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        balloonLayout: 'islands#balloon',
        clusterBalloonItemContentLayout: clasterContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonPagerSize: 5,
        groupByCoordinates: false,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false
    });
    const balloonLayout = ymaps.templateLayoutFactory.createClass(`
            <div class="popup">
                <div class="arrow"></div>
                <div class="popup__header">
                    <i class="fas fa-map-marker-alt popup__geo"></i> {{properties.address}}
                    <div class="close">
                        <i class="fas fa-times popup__close"></i>
                    </div>
                </div>
                <div class="popup__reviews">
                    <div class="popup__reviews-container">
                        <ul class="popup__reviews-list">
                            <div class="popup__review-header">
                                    <div class="popup__review-name">{{properties.name}}</div>
                                    <span class="popup__reviews-place">{{properties.place}} {{properties.date}}</span>
                                </div>
                                <div class="popup__review-text">
                                    {{properties.text}}
                                </div>
                            {% if !properties.name or !properties.flag %}
                            <div class="reviews__empty">Отзывов нет!</div>
                            {% endif %}
                            <div class="popup__review-name">{{234}}</div>
                            {% for item in properties.reviews %}
                            <li class="popup__reviews-item">
                                <div class="popup__review-header">
                                    <div class="popup__review-name">{{item.name}}</div>
                                    <span class="popup__reviews-place">{{item.place}} {{item.date}}</span>
                                </div>
                                <div class="popup__review-text">
                                    {{item.text}}
                                </div>
                            </li>
                            {% endfor %}
                        </ul>
                    </div>
                </div>
                <div class="popup__form">
                    <form action="" id="form">
                        <input style="display: none" type="text" id="review-coords" name="coords" value="{{properties.coords}}">
                        <div class="popup__form-row">
                            <input type="text" placeholder="Ваше имя" id="review-name" class="popup__input" name="name">
                        </div>
                        <div class="popup__form-row">
                            <input type="text" placeholder="Укажите место" id="review-place" class="popup__input" name="place">
                        </div>
                        <div class="popup__form-row">
                            <textarea name="review" placeholder="Поделитесь впечатлениями" class="popup__input popup__input_text"
                                id="review"></textarea>
                        </div>
                        <div class="popup__form-row">
                            <button class="add-review">Добавить</button>
                        </div>
                    </form>
                </div>
            </div>
        `, {
        build: async function () {
            balloonLayout.superclass.build.call(this);
            const closeButton = document.querySelector('.close');
            const addReviewButton = document.querySelector('.add-review');
            const reviewerName = document.querySelector('#review-name');
            const reviewerText = document.querySelector('#review');
            const reviewerCoords = document.querySelector('#review-coords');
            const reviewerList = document.querySelector('.popup__reviews-list');
            const reviewPlace = document.querySelector('#review-place');
            const popapHeader = document.querySelector('.popup__header').textContent;
            
            this._$element = this.getParentElement().querySelector('.popup');
            this.applyElementOffset();

            if (this._data.properties._data && this._data.properties._data.rating) {
                var yObjCoords = this._data.properties._data.point.reverse().toString();
            }

            closeButton.addEventListener('click', (e) => {
                this.events.fire('userclose');
            });

            addReviewButton.addEventListener('click', (e) => {
                e.preventDefault();
                const date = new Date().toLocaleString();
                var coordsString;
                if (reviewerCoords.value) {
                    coordsString = reviewerCoords.value.split(',').toString()
                }  else if (this._data.properties._data.coords) {
                    coordsString = this._data.properties._data.coords
                } else {
                    coordsString = yObjCoords
                }
                var point = {
                    coords: coordsString,
                    name: reviewerName.value,
                    text: reviewerText.value,
                    place: reviewPlace.value,
                    date: date,
                };
                points.push(point);
                localStorage.setItem('marks', JSON.stringify(points));
                this.addMark(coordsString,popapHeader, reviewerName.value, reviewerText.value, date);
                addReview(reviewerList, point, reviewPlace);
                reviewerName.value = '';
                reviewPlace.value = '';
                reviewerText.value = '';
            });
        },
        addMark: function(coordsString, popapHeader, name, text, date) {
            var myPlacemark = new ymaps.Placemark(coordsString.split(','), {
                coords: coordsString,
                address: popapHeader,
                name: name,
                text: text,
                date: date,
                flag: "flag"
            }, {
                preset: 'islands#violetIcon'
            });
            clusterer.add(myPlacemark);
            myMap.geoObjects.add(clusterer);
        },
        clear: function () {
            balloonLayout.superclass.clear.call(this);
        },
        applyElementOffset: function () {
            Object.assign(this._$element.style, {
                left: -(this._$element.offsetWidth / 2) + 'px',
                top: -(this._$element.offsetHeight + this._$element.querySelector('.arrow').offsetHeight) + 'px',
            });
        },
        getShape: function () {
            if (!this._isElement(this._$element)) {
                return balloonLayout.superclass.getShape.call(this);
            }

            var style = getComputedStyle(this._$element);
            var position = {
                left: parseFloat(style.left),
                top: parseFloat(style.top),
            };

            return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([
                [position.left, position.top], [
                    position.left + this._$element.offsetWidth,
                    position.top + this._$element.offsetHeight + this._$element.querySelector('.arrow').offsetHeight
                ]
            ]));
        },
        _isElement: function (element) {
            return element && element.querySelector('.arrow');
        }
    });

    function addReview(reviewerList, point) {
        const reviewsEmpty = reviewerList.querySelector('.reviews__empty');
        const li = document.createElement('li');
        const reviewHeader = document.createElement('div');
        const reviewName = document.createElement('div');
        const reviewText = document.createElement('div');
        const reviewPointPlace = document.createElement('span');
        if (reviewsEmpty) {
            reviewsEmpty.style.display = 'none';
        }
        reviewName.classList.add('popup__review-name');
        reviewText.classList.add('popup__review-text');
        reviewHeader.classList.add('popup__review-header');
        reviewName.innerHTML = point.name;
        reviewText.innerHTML = point.text;
        reviewPointPlace.innerHTML = point.place + ' ' + point.date;
        reviewPointPlace.classList.add('popup__reviews-place');
        li.classList.add('popup__reviews-item');
        reviewHeader.appendChild(reviewName);
        reviewHeader.appendChild(reviewPointPlace);
        li.appendChild(reviewHeader);
        li.appendChild(reviewText);
        reviewerList.appendChild(li);
    }

    const myMap = new ymaps.Map('map', {
        center: [55.751574, 37.573856],
        zoom: 15,
        behaviors: ['default', 'scrollZoom'],
        controls: []
    }, { balloonLayout: balloonLayout });

    myMap.events.add('click', async e => {
        const coords = e.get('coords');
        const address = await getMapPosition(coords);
        const data = await JSON.parse(localStorage.getItem('marks'));
        const reviews = [];
        if (data) {
            for (const item of data) {
                const newAddress = await getMapPosition(item.coords)
                if (newAddress == address) {
                    reviews.push({
                        name: item.name,
                        text: item.text,
                        place: item.place,
                        date: item.date
                    })
                }
            }
        }

        myMap.balloon.open(coords, {
            properties: {
                address: address,
                coords: coords,
                reviews: reviews,
            }
        });
    });

    myMap.geoObjects.events.add('click',async e => {
        if (e.get('target')._clusterListeners) {
            clusterer.balloon.open(clusterer.getClusters()[0], {

            });
        }else {
            const coords = e.get('coords');
            const address = await getMapPosition(coords);
            const data = await JSON.parse(localStorage.getItem('marks'));
            const reviews = [];
            for (const item of data) {
                const newAddress = await getMapPosition(item.coords)
                if (newAddress == address) {
                    reviews.push({
                        name: item.name,
                        text: item.text,
                        place: item.place,
                        date: item.date
                    })
                }
            }

        }
    });

    async function getMapPosition(coords) {
        const geocode = await ymaps.geocode(coords);
        const address = geocode.geoObjects.get(0).properties.get('text');

        return address;
    };

    if (points) {
        points.forEach(async item => {
            const point = new ymaps.Placemark(item.coords.split(','), {
                coords: item.coords,
                address: await getMapPosition(item.coords),
                reviews: {
                    name: item.name,
                    text: item.text
                }
            }, {
                preset: 'islands#violetIcon'
            });
            clusterer.add(point);
        });
    }

    myMap.geoObjects.add(clusterer);

    myMap.panes.get('ground').getElement().style.filter = 'grayscale(70%)';
    var button = new ymaps.control.Button({
        data: {
            iconType: 'loupe',
            title: 'Button Text'
        },
        options: {
            layout: 'round#buttonLayout',
            maxWidth: 120
        }
    });

    myMap.controls.add(button);
    var geolocationControl = new ymaps.control.GeolocationControl({
        options: {
            layout: 'round#buttonLayout'
        }
    });

    myMap.controls.add(geolocationControl);
    var rulerControl = new ymaps.control.RulerControl({
        options: {
            layout: 'round#rulerLayout'
        }
    });

    myMap.controls.add(rulerControl);
    var zoomControl = new ymaps.control.ZoomControl({
        options: {
            layout: 'round#zoomLayout'
        }
    });

    myMap.controls.add(zoomControl);
    var typeSelector = new ymaps.control.TypeSelector({
        options: {
            layout: 'round#listBoxLayout',
            itemLayout: 'round#listBoxItemLayout',
            itemSelectableLayout: 'round#listBoxItemSelectableLayout',
            float: 'none',
            position: {
                bottom: '100px',
                right: '10px'
            }
        }
    });

    myMap.controls.add(typeSelector);
}
