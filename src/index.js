const div = document.querySelector('.div')
ymaps.ready(init);
function init(){
    const balloonLayout = ymaps.templateLayoutFactory.createClass(`
        <div class="popup">
            <div class="popup__header">
                <i class="fas fa-map-marker-alt popup__geo"></i> {{properties.address}}
                <div class="close">
                    <i class="fas fa-times popup__close"></i>
                </div>
            </div>
            <div class="popup__reviews">
                <div class="popup__reviews-container">
                    <ul class="popup__reviews-list">
                        {% if !properties.reviews.length %}
                        <div class="reviews__empty">Отзывов нет!</div>
                        {% endif %}
                        {% for item in properties.reviews %}
                        <li class="popup__reviews-item">
                            <div class="popup__review-header">
                                <div class="popup__review-name">{{item.name}}</div>
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
            const popapHeader = document.querySelector('.popup__header').textContent;

            closeButton.addEventListener('click', (e) => {
                this.events.fire('userclose');
            })

            addReviewButton.addEventListener('click', (e) => {
                e.preventDefault();

                const coordsString = reviewerCoords.value.split(',').toString();
                var point = {
                    coords: coordsString || this._data.properties._data.coords,
                    name: reviewerName.value,
                    text: reviewerText.value,
                };
                data.push(point);
                localStorage.setItem('marks', JSON.stringify(data));
                this.addMark(coordsString,popapHeader);

                addReview(reviewerList, point);
            });
        },
        addMark: function(coordsString, popapHeader) {
            const data = JSON.parse(localStorage.getItem('marks'));
            const reviews = [];
            for (const item of data) {
                if (item.coords == coordsString) {
                    reviews.push({
                        name: item.name,
                        text: item.text
                    })
                }
            }
            var myPlacemark = new ymaps.Placemark(coordsString.split(','), {
                coords: coordsString,
                address: popapHeader,
                reviews: reviews
            });

            myMap.geoObjects.add(myPlacemark);
        },
        clear: function () {
            balloonLayout.superclass.clear.call(this);
        },
    });

    function addReview(reviewerList, point) {
        const reviewsEmpty = reviewerList.querySelector('.reviews__empty');
        const li = document.createElement('li');
        const reviewHeader = document.createElement('div');
        const reviewName = document.createElement('div');
        const reviewText = document.createElement('div');
        if (reviewsEmpty) {
            reviewsEmpty.style.display = 'none';
        }
        reviewName.classList.add('popup__review-name');
        reviewText.classList.add('popup__review-text');
        reviewHeader.classList.add('popup__review-header');
        reviewName.innerHTML = point.name;
        reviewText.innerHTML = point.text;
        li.classList.add('popup__reviews-item');
        reviewHeader.appendChild(reviewName);
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

        myMap.balloon.open(coords, {
            properties: {
                address: address,
                coords: coords
            }
        });
    });

    myMap.geoObjects.events.add('click',async e => {
        if (e.get('target')._geoObjectComponent) {
            const coords = e.get('coords');
            const address = await getMapPosition(coords);
            const data = JSON.parse(localStorage.getItem('marks'));
            const reviews = [];

            for (const item of data) {
                const newAddress = await getMapPosition(item.coords)
                if (newAddress == address) {
                    reviews.push({
                        name: item.name,
                        text: item.text
                    })
                }
            }
            myMap.balloon.open(coords, {
                properties: {
                    address: address,
                    coords: coords,
                    reviews:reviews
                }
            });
        }
    })

    async function getMapPosition(coords) {
        const geocode = await ymaps.geocode(coords);
        const address = geocode.geoObjects.get(0).properties.get('text');

        return address;
    };

    const clasterContentLayout = ymaps.templateLayoutFactory.createClass(`
        <div class="cluster__link"><a class="search_by_address">{{ properties.address|raw }}</a></div>
        <div class="">{{ properties.reviews.name }}</div>
        <div class="search_by_coords" style="display: none">{{ properties.coords }}</div>
        <div class="">{{ properties.reviews.text }}</div>`
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
                                name: item.name,
                                text: item.text
                            })
                        }
                    }
                    myMap.balloon.open(coords.textContent.split(','), {
                        properties: {
                            address: selectPoint.textContent,
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

    points = JSON.parse(localStorage.getItem('marks'));
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
