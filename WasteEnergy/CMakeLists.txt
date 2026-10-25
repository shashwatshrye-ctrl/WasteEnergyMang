cmake_minimum_required(VERSION 3.16)

project(WasteEnergy)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(CTest)

add_library(WasteEnergyBackend
    backend.cpp
    backend.h
)

add_executable(WasteEnergyApi backend_api.cpp)
target_link_libraries(WasteEnergyApi PRIVATE WasteEnergyBackend)

if(BUILD_TESTING)
    add_executable(WasteEnergyBackendTests backend_tests.cpp)
    target_link_libraries(WasteEnergyBackendTests PRIVATE WasteEnergyBackend)
    add_test(NAME WasteEnergyBackendTests COMMAND WasteEnergyBackendTests)
endif()

option(WASTEENERGY_BUILD_GUI "Build the Qt desktop application" ON)

if(WASTEENERGY_BUILD_GUI)
    find_package(Qt6 REQUIRED COMPONENTS Widgets)

    qt_add_executable(WasteEnergy
        main.cpp
        mainwindow.cpp
        mainwindow.h
    )

    target_link_libraries(WasteEnergy PRIVATE WasteEnergyBackend Qt6::Widgets)
endif()