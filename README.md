# README

Небольшое приложение для ведения базы данных хостов и простого ICMP мониторинга.

Состоит из нескольких демонов, общающихся между собой по протоколу WAMP.

В качестве базы данных используется PostgreSQL, версии не ниже 9.4.

Серверная часть написана на Python 3.5, клиентская на JavaScript (ES6) с использованием React и Redux.

## Установка

Создаём системного пользователя:

    sudo useradd -r -U -d /opt/nab nab
    sudo chmod 755 /opt/nab

Копируем файлы в место установки:

    git clone ... nab/
    sudo cp -r nab/* /opt/nab/
    sudo chown -R nab. /opt/nab/

Создаём virtualenv и устанавливаем модуль c зависимостями:

    sudo -u nab virtualenv-3 -p python3.5 /opt/nab/venv
    sudo -u nab /opt/nab/venv/bin/pip install --editable /opt/nab

Для взаимодействия демонов нужен WAMP роутер, устанавливаем `crossbar` любым удобным способом по инструкции с официального сайта, затем генерируем конфиг:

    sudo -u nab -i
    cd /opt/nab
    crossbar init

При необходимости редактируем `/opt/nab/.crossbar/config.json`.

Далее, еобходимо создать роль и базу данных в постгрес:

    sudo -u postgres psql -c "CREATE USER nwaddrbook_user WITH PASSWORD 'nwaddrbook_pw';"
    sudo -u postgres psql -c "CREATE DATABASE nwaddrbookdb WITH OWNER = nwaddrbook_user;"

Затем создать схему:

    psql nwaddrbookdb nwaddrbook_user < sql/schema-00-init.sql

Скопировав в удобное место и отредактировав файлы конфигурации (примеры лежат в `example`) запускаем сервисы.

Копируем примеры файлов конфигурации в `/opt/nab/etc` и вносим необходимые изменения.

Копируем .service файлы в `/etc/systemd/system` и вносим исправления, если необходимо. Затем запускаем сервисы:

    sudo systemctl start nab-crossbar
    sudo systemctl start nab-icmp-poller
    sudo systemctl start nab-webserver

Открываем браузер и переходим по адресу, который мы сконфигурировали для вебсервера (по-умолчанию http://localhost:8081).
