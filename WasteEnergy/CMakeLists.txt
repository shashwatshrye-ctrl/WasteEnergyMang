cmake_minimum_required(VERSION 3.16)

project(WasteEnergy)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 REQUIRED COMPONENTS Widgets)

qt_add_executable(WasteEnergy
    main.cpp
    mainwindow.cpp
    mainwindow.h
)

target_link_libraries(WasteEnergy PRIVATE Qt6::Widgets)